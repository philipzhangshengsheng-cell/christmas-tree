import { Hands } from "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
import { Camera } from "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";

/********** 1. Three.js 基础 **********/
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera3D = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera3D.position.set(0, 3, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

/********** 2. 彩虹圣诞树（粒子） **********/
const treeGroup = new THREE.Group();
scene.add(treeGroup);

const treeGeo = new THREE.BufferGeometry();
const positions = [];
const colors = [];
for (let i = 0; i < 3500; i++) {
  const y = Math.random() * 6;
  const radius = (1 - y / 6) * 2.5 * Math.random();
  const angle = Math.random() * Math.PI * 2;
  positions.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  const hue = y / 6; // 彩虹渐变
  const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
  colors.push(color.r, color.g, color.b);
}
treeGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
treeGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

const tree = new THREE.Points(
  treeGeo,
  new THREE.PointsMaterial({ size: 0.06, vertexColors: true })
);
treeGroup.add(tree);

/********** 3. 照片装饰（7 张） **********/
const photoUrls = [
  "./img1.png",
  "./img2.png",
  "./img3.png",
  "./img4.png",
  "./img5.png",
  "./img6.png",
  "./img7.png"
];
photoUrls.forEach((url, i) => {
  const texture = new THREE.TextureLoader().load(url);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  const y = 0.8 + i * 0.6;
  const angle = (i / photoUrls.length) * Math.PI * 2;
  const radius = 1.8;
  sprite.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  sprite.scale.set(0.9, 0.9, 1);
  treeGroup.add(sprite);
});

/********** 4. 树顶二维文字 **********/
const textCanvas = document.createElement("canvas");
textCanvas.width = 512;
textCanvas.height = 256;
const ctx = textCanvas.getContext("2d");
ctx.clearRect(0, 0, 512, 256);
const gradient = ctx.createLinearGradient(0, 0, 512, 0);
gradient.addColorStop(0, "#ffd700");
gradient.addColorStop(0.5, "#ffffff");
gradient.addColorStop(1, "#ff4d4d");
ctx.fillStyle = gradient;
ctx.font = "bold 56px PingFang SC, Arial";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("Merry Christmas", 256, 90);
ctx.fillText("涂小宝", 256, 160);
const textTexture = new THREE.CanvasTexture(textCanvas);
const textSprite = new THREE.Sprite(
  new THREE.SpriteMaterial({ map: textTexture, transparent: true })
);
textSprite.position.set(0, 6.8, 0);
textSprite.scale.set(3.8, 1.8, 1);
treeGroup.add(textSprite);

/********** 5. MediaPipe Hands 手势 **********/
let handX = 0.5, handSize = 0.15;
const hands = new Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
hands.setOptions({ maxNumHands:1, modelComplexity:1, minDetectionConfidence:0.7, minTrackingConfidence:0.7 });
hands.onResults(results => {
  if (results.multiHandLandmarks?.length) {
    const lm = results.multiHandLandmarks[0];
    handX = lm[9].x;
    const dx = lm[5].x - lm[17].x;
    const dy = lm[5].y - lm[17].y;
    handSize = Math.sqrt(dx*dx+dy*dy);
  }
});
const video = document.getElementById("video");
const cam = new Camera(video, { onFrame: async()=>{await hands.send({image:video});}, width:640, height:480 });
cam.start();

/********** 6. 动画循环 **********/
function animate(){
  requestAnimationFrame(animate);
  const targetRot = (handX - 0.5) * 3;
  treeGroup.rotation.y += (targetRot - treeGroup.rotation.y) * 0.1;
  const targetScale = THREE.MathUtils.clamp(1 + (0.18 - handSize) * 6, 0.6, 2.5);
  treeGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  renderer.render(scene, camera3D);
}
animate();

/********** 7. 自适应窗口 **********/
window.addEventListener("resize", ()=>{
  camera3D.aspect = window.innerWidth / window.innerHeight;
  camera3D.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
