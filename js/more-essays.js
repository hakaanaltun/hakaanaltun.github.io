(function(){
var ALL_ESSAYS=[
  {href:'best-ideas.html',title:'The Best Ideas Come When You Let Go',subtitle:'Default Mode Network and the art of not thinking',img:'https://miro.medium.com/v2/resize:fit:600/1*UjDYBeUBBvmImB5JFvYC0A.jpeg'},
  {href:'empathy-paradox.html',title:'The Empathy Paradox',subtitle:'Outside every story but our own',img:'https://miro.medium.com/v2/resize:fit:600/1*pN4_9fIbWOr7dNg27qdGqA.png'},
  {href:'love-or-fear.html',title:'It Is Either from Love or Fear',subtitle:'Fear wears love\u2019s face \u2014 and speaks its language',img:'https://miro.medium.com/v2/resize:fit:600/1*1e3whgMVRxzw13ve5wK1MA.png'},
  {href:'unfinished-things.html',title:'Why Do Unfinished Things Haunt Us?',subtitle:'The Zeigarnik\u2013Lacan trap we all fall into',img:'https://miro.medium.com/v2/resize:fit:600/1*jfEURVCn1DDTIIiU7S_fFg.png'},
  {href:'jung-shadow.html',title:'Jung\u2019s Golden Shadow',subtitle:'Why we envy the things we forbid ourselves the most',img:'https://miro.medium.com/v2/resize:fit:600/1*xGR4JAqJxcwp-NNSDaadyw.png'},
  {href:'defense-mechanisms.html',title:'Our Defense Mechanisms: Protectors or Dungeon Masters?',subtitle:'Have we handed over the keys to our own prisons?',img:'https://miro.medium.com/v2/resize:fit:600/1*vJenz3RNAUcWpK9zgnv9iA.png'},
  {href:'ai-enough.html',title:'Will AI Be Enough for Us?',subtitle:'A reflection on AI\u2019s promise and the warmth it can\u2019t replicate',img:'https://miro.medium.com/v2/resize:fit:600/1*xktOKOEkb01NorbJNzs4yA.png'},
  {href:'say-hello.html',title:'Why Do We Say Hello?',subtitle:'Transactional Analysis and the hidden games in our relationships',img:'https://miro.medium.com/v2/resize:fit:600/1*_TffjC5cdVkKJoadRfi3tQ.png'},
  {href:'on-lying.html',title:'On Lying',subtitle:'Not being caught carries its own sentence.',img:'https://miro.medium.com/v2/resize:fit:600/1*IqjZ2v3VkF7FE6Ax3briCA.png'},
  {href:'on-perceiving.html',title:'On Perceiving',subtitle:'Misperception is a corridor whose architect burned the blueprint.',img:'https://miro.medium.com/v2/resize:fit:600/1*yOa_B48M5L0j4xm7w8wnKQ.png'},
  {href:'on-looking.html',title:'On Looking',subtitle:'A room full of directors and no audience.',img:'https://miro.medium.com/v2/resize:fit:600/1*g2FLjY3V9utA09Yp_CaQYQ.png'},
  {href:'on-forgiveness.html',title:'On Forgiveness',subtitle:'Cruelty made architectural.',img:'https://miro.medium.com/v2/resize:fit:600/1*7rEEeB6sH4VS-tePMsb4_w.png'},
  {href:'on-beauty.html',title:'On Beauty',subtitle:'The corridor narrows in adversity.',img:'../images/on-beauty.png'},
  {href:'on-longing.html',title:'On Longing',subtitle:'Lighter. Smaller. Younger.',img:'../images/on-longing.png'},
  {href:'on-silence.html',title:'On Silence',subtitle:'I forgot I had a cat.',img:'../images/on-silence.jpg'}
];
var currentPage=window.location.pathname.split('/').pop();
var pool=ALL_ESSAYS.filter(function(e){return e.href!==currentPage;});
for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=pool[i];pool[i]=pool[j];pool[j]=t;}
var picks=pool.slice(0,4);
var ul=document.getElementById('random-essays');
if(!ul){console.warn('more-essays: #random-essays element not found');return;}
picks.forEach(function(e){
  var li=document.createElement('li');
  var a=document.createElement('a');
  a.href=e.href;
  a.className='essay-card';
  var img=document.createElement('img');
  img.src=e.img;
  img.alt=e.title;
  img.className='essay-thumb';
  img.loading='lazy';
  var div=document.createElement('div');
  div.className='essay-card-text';
  var titleSpan=document.createElement('span');
  titleSpan.className='essay-title';
  titleSpan.textContent=e.title;
  var subSpan=document.createElement('span');
  subSpan.className='essay-card-subtitle';
  subSpan.textContent=e.subtitle;
  div.appendChild(titleSpan);
  div.appendChild(subSpan);
  a.appendChild(img);
  a.appendChild(div);
  li.appendChild(a);
  ul.appendChild(li);
});
})();
