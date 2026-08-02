package com.hvis.closedloopdungeon;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class MainActivity extends Activity implements PurchasesUpdatedListener {
    private static final String PREMIUM_PRODUCT_ID = "premium_stage_pack";
    private static final String PURCHASE_PREFS_NAME = "closed_loop_purchases";
    private static final String PURCHASED_PRODUCTS_KEY = "purchased_products";

    private WebView webView;
    private BillingClient billingClient;
    private ProductDetails premiumProductDetails;
    private boolean billingReady;
    private SharedPreferences purchasePreferences;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        purchasePreferences = getSharedPreferences(PURCHASE_PREFS_NAME, MODE_PRIVATE);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new BillingBridge(), "ClosedLoopBilling");
        webView.clearCache(true);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.loadUrl("file:///android_asset/index.html?android=1&v=0.1.3");

        setupBillingClient();
    }

    @Override
    protected void onDestroy() {
        if (billingClient != null) {
            billingClient.endConnection();
        }

        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }

        super.onBackPressed();
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            handlePurchases(purchases);
            return;
        }

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            notifyBillingStatus("purchaseCanceled");
            return;
        }

        notifyBillingStatus("purchaseFailed");
    }

    private void setupBillingClient() {
        if (billingClient != null) {
            return;
        }

        billingClient = BillingClient.newBuilder(this)
            .setListener(this)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .build()
            )
            .build();

        startBillingConnection();
    }

    private void startBillingConnection() {
        if (billingClient == null) {
            setupBillingClient();
            return;
        }

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    billingReady = false;
                    notifyBillingStatus("billingUnavailable");
                    return;
                }

                billingReady = true;
                queryPremiumProductDetails();
                queryExistingPurchases();
            }

            @Override
            public void onBillingServiceDisconnected() {
                billingReady = false;
            }
        });
    }

    private void queryPremiumProductDetails() {
        QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
            .setProductId(PREMIUM_PRODUCT_ID)
            .setProductType(BillingClient.ProductType.INAPP)
            .build();

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(Collections.singletonList(product))
            .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, queryProductDetailsResult) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                notifyBillingStatus("productUnavailable");
                return;
            }

            List<ProductDetails> productDetailsList = queryProductDetailsResult.getProductDetailsList();
            premiumProductDetails = productDetailsList.isEmpty() ? null : productDetailsList.get(0);
            notifyBillingStatus(premiumProductDetails == null ? "productUnavailable" : "billingReady");
        });
    }

    private void queryExistingPurchases() {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.INAPP)
            .build();

        billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                handlePurchases(purchases);
            }
        });
    }

    private void launchPremiumPurchase() {
        if (billingClient == null) {
            setupBillingClient();
            notifyBillingStatus("billingUnavailable");
            return;
        }

        if (!billingReady) {
            startBillingConnection();
            notifyBillingStatus("billingUnavailable");
            return;
        }

        if (premiumProductDetails == null) {
            queryPremiumProductDetails();
            notifyBillingStatus("productUnavailable");
            return;
        }

        BillingFlowParams.ProductDetailsParams.Builder productParamsBuilder =
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(premiumProductDetails);

        List<ProductDetails.OneTimePurchaseOfferDetails> offerDetails =
            premiumProductDetails.getOneTimePurchaseOfferDetailsList();
        if (offerDetails != null && !offerDetails.isEmpty()) {
            productParamsBuilder.setOfferToken(offerDetails.get(0).getOfferToken());
        }

        BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(Collections.singletonList(productParamsBuilder.build()))
            .build();

        billingClient.launchBillingFlow(this, billingFlowParams);
    }

    private void handlePurchases(List<Purchase> purchases) {
        for (Purchase purchase : purchases) {
            if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) {
                continue;
            }

            if (!purchase.getProducts().contains(PREMIUM_PRODUCT_ID)) {
                continue;
            }

            rememberPurchasedProduct(PREMIUM_PRODUCT_ID);

            if (!purchase.isAcknowledged()) {
                AcknowledgePurchaseParams acknowledgeParams = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.getPurchaseToken())
                    .build();
                billingClient.acknowledgePurchase(acknowledgeParams, billingResult -> {
                    notifyPurchasedProducts();
                    notifyBillingStatus(
                        billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK
                            ? "purchaseComplete"
                            : "acknowledgeFailed"
                    );
                });
            } else {
                notifyPurchasedProducts();
                notifyBillingStatus("purchaseComplete");
            }
        }
    }

    private void rememberPurchasedProduct(String productId) {
        Set<String> purchasedProducts = new HashSet<>(
            purchasePreferences.getStringSet(PURCHASED_PRODUCTS_KEY, Collections.emptySet())
        );
        purchasedProducts.add(productId);
        purchasePreferences.edit()
            .putStringSet(PURCHASED_PRODUCTS_KEY, purchasedProducts)
            .apply();
    }

    private List<String> getPurchasedProducts() {
        return new ArrayList<>(
            purchasePreferences.getStringSet(PURCHASED_PRODUCTS_KEY, Collections.emptySet())
        );
    }

    private void notifyPurchasedProducts() {
        List<String> purchasedProducts = getPurchasedProducts();
        StringBuilder script = new StringBuilder("window.closedLoopBilling?.setPurchasedPremiumPacks([");
        for (int index = 0; index < purchasedProducts.size(); index += 1) {
            if (index > 0) {
                script.append(",");
            }
            script.append("'").append(purchasedProducts.get(index).replace("'", "\\'")).append("'");
        }
        script.append("]);");
        runJavascript(script.toString());
    }

    private void notifyBillingStatus(String status) {
        runJavascript("window.closedLoopBilling?.setBillingStatus('" + status + "');");
    }

    private void runJavascript(String script) {
        runOnUiThread(() -> {
            if (webView != null) {
                webView.evaluateJavascript(script, null);
            }
        });
    }

    private class BillingBridge {
        @JavascriptInterface
        public void purchasePremiumPack(String productId) {
            if (!PREMIUM_PRODUCT_ID.equals(productId)) {
                notifyBillingStatus("productUnavailable");
                return;
            }

            runOnUiThread(() -> launchPremiumPurchase());
        }

        @JavascriptInterface
        public void restorePurchases() {
            if (billingClient == null) {
                setupBillingClient();
                notifyPurchasedProducts();
                return;
            }

            if (billingReady) {
                queryExistingPurchases();
            } else {
                startBillingConnection();
            }
            notifyPurchasedProducts();
        }

        @JavascriptInterface
        public boolean isPremiumPackPurchased(String productId) {
            return getPurchasedProducts().contains(productId);
        }
    }
}
