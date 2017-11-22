const CONTAINER_HEIGHT = 600;
const CONTAINER_WIDTH = 600;

function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
}

class DomImage {
  constructor(src, container, width, height) {
    this.width = width;
    this.height = height;
    this.speedX = 1 + Math.random() * 5;
    this.speedY = 2 + Math.random() * 10;
    this.transfromX = 0;
    this.transfromY = 0;

    this.img = document.createElement('img');
    this.img.src = src;
    this.img.style.opacity = 0.3;
    this.img.style.position = 'absolute';
    this.img.style.left = '0';
    this.img.style.top = '0';
    container.appendChild(this.img);
  }

  update() {
    this.transfromX += this.speedX;
    this.transfromY += this.speedY;
    if (this.transfromX < 0 || this.transfromX > (CONTAINER_WIDTH - this.width)) {
      this.speedX *= -1;
    }
    if (this.transfromY < 0 || this.transfromY > (CONTAINER_HEIGHT - this.height)) {
      this.speedY *= -1;
    }
    this.transfromX = clamp(this.transfromX, 0, CONTAINER_WIDTH - this.width);
    this.transfromY = clamp(this.transfromY, 0, CONTAINER_HEIGHT - this.height);

    this.img.style.transform = `translate(${this.transfromX}px, ${this.transfromY}px)`;
  }
}

const container = document.querySelector('#container');

const images = [];
function addImgs(count) {
  for (let i = 0; i < count; i++) {
    images.push(new DomImage('island.png', container, 64, 64));
  }
  document.querySelector('p').innerHTML = `Image count: ${images.length}`
}

function updateImages() {
  images.forEach(d => d.update());
  requestAnimationFrame(updateImages);
}
requestAnimationFrame(updateImages);

document.querySelector('#add10').onclick = () => addImgs(10);
document.querySelector('#add50').onclick = () => addImgs(50);
document.querySelector('#add100').onclick = () => addImgs(100);