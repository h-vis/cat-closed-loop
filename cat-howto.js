const params = new URLSearchParams(location.search);
const language = params.get('lang') === 'en' ? 'en' : 'ja';
const lessons = [
  ['cat-1', ['ひとふでで、お部屋を分けよう', '何もないマスをドラッグして、ひと続きの線を描きます。線と盤面の端で空間を区切りましょう。同じ空間にいるものに合わせて、猫や犬がとことこ動きます。線は枝分かれできません。'], ['One line, a cozy room', 'Drag across empty cells to draw one continuous line. Divide the room using the line and board edges. The cat walks to objects that share its space. Your line cannot branch.']],
  ['fish', ['まずは、おさかな', '猫と魚が同じ空間に入ると、猫が魚まで歩き、到着すると魚をもらえます。魚を取ると、段ボールが開きます。'], ['A fish for your friend', 'Put the cat and fish in the same space to collect the fish automatically. The cardboard box will open.']],
  ['box-open', ['段ボールで、ひとやすみ', '魚を取ったあと、猫と段ボールを同じ空間に入れればクリア。クリア画面をタップすると次のお部屋へ進めます。'], ['A little place to rest', 'After collecting the fish, put the cat and box in the same space. The stage clears after the cat walks over and settles into the box. Tap the cleared board to visit the next room.']],
  ['dog-1', ['犬とは、別のお部屋に', '猫と犬が同じ空間にいると、猫がびっくりしてやり直しになります。線を引いて、猫と犬の空間を分けてあげましょう。'], ['Give the dog its own space', 'The cat gets startled if a dog shares its space, and you will need to try again. Draw a line to keep them in separate areas.']],
  ['bone', ['骨をあげて、おやすみ', '猫のいない空間に、犬と骨を同じ数だけ入れると、犬は骨をもらっておやすみ。両方が盤面から消えます。数が違うと残ります。猫も一緒だと、骨があっても先にびっくりしてしまいます。'], ['A bone, then a nap', 'In a space without the cat, equal numbers of dogs and bones leave the board together. Unequal numbers stay. If the cat is there too, it gets startled before the bones can help.']],
  ['bag', ['紙袋は、先にくぐる', '紙袋は2つで1組。片方だけを猫と同じ空間に入れると、もう片方へ移動します。犬・魚・段ボールの判定より先に移動します。両方が猫と同じ空間にあると移動しません。'], ['Paper bags: travel first', 'Bags come in pairs. Put exactly one bag in the cat’s space to travel to its partner before dogs, fish and the box are checked. Sharing a space with both bags will not move the cat.']],
  ['tunnel', ['猫トンネルは、あとでくぐる', '猫トンネルも2つで1組。こちらは犬・魚・段ボールの判定後に移動します。犬と猫が同じ空間だと、トンネルに入る前にやり直しです。両方が同じ空間なら移動しません。'], ['Cat tunnels: travel afterward', 'Tunnels also come in pairs, but move the cat after dogs, fish and the box are checked. A dog in the cat’s space means trying again before traveling. Both tunnels in the same space will not activate.']],
  ['box-closed', ['壁を使って、ゆっくり考えよう', '茶色の壁には線を描けませんが、線とつなげれば境界の一部になります。物のあるマスにも線は描けません。うまくいかなくても、リセットで何度でもやり直せます。'], ['Take your time', 'You cannot draw on brown walls or occupied cells. Connected walls become part of your boundary, so keep the whole line free of branches. Reset and try again whenever you like.']],
];
document.documentElement.lang = language;
document.title = `${language === 'ja' ? '遊び方' : 'How to play'} | Closed-Loop Cat`;
document.querySelector('.page-title').textContent = language === 'ja' ? '猫と、ひとふで。' : 'One line. Happy cats.';
for (const [asset, ja, en] of lessons) {
  const [title, text] = language === 'ja' ? ja : en;
  const article = document.createElement('article');
  const image = document.createElement('img');
  image.src = `assets/cats/${asset}.png`;
  image.alt = '';
  const copy = document.createElement('div');
  const heading = document.createElement('h2');
  heading.textContent = title;
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  copy.append(heading, paragraph);
  article.append(image, copy);
  document.getElementById('howtoSteps').append(article);
}
const backParams = new URLSearchParams({lang: language});
if (params.get('return') === 'game') backParams.set('resume', '1');
if (params.get('android') === '1') backParams.set('android', '1');
const back = document.getElementById('backToGameLink');
back.href = `index.html?${backParams}`;
back.textContent = language === 'ja' ? 'ゲームに戻る' : 'Back to the cats';
