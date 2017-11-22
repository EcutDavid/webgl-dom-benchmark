const CONTAINER_HEIGHT = 600;
const CONTAINER_WIDTH = 600;
const IMAGE_WIDTH = 64;
const IMAGE_HEIGHT = 64;

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    console.warn(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }

  return program;
}

function createShader(gl, type, shaderSource) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }

  return shader;
}

const vertexShaderSource = `
  attribute vec2 a_cord;
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  varying vec2 v_cord;

  void main() {
    v_cord = a_cord;
    vec2 unifiedPos = (a_position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(unifiedPos * vec2(1, -1), 1, 1);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec2 v_cord;
  uniform sampler2D u_texture;

  void main() {
    gl_FragColor = texture2D(u_texture, v_cord.xy);
    gl_FragColor.a = 0.7;
  }
`;

const gl = document.querySelector('canvas').getContext('webgl');

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

gl.useProgram(program);

const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionAttributeLocation);
const cordAttributeLocation = gl.getAttribLocation(program, 'a_cord');
gl.enableVertexAttribArray(cordAttributeLocation);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// gl.vertexAttribPointer(location, size, type, normalize, stride, offset)
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  0, 0, IMAGE_WIDTH, 0, 0, IMAGE_HEIGHT,
  IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_WIDTH, 0, 0, IMAGE_HEIGHT,
]), gl.STATIC_DRAW);

const cordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, cordBuffer);
gl.vertexAttribPointer(cordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  0, 0, 1, 0, 0, 1,
  1, 1, 1, 0, 0, 1,
]), gl.STATIC_DRAW);

const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
gl.uniform2f(resolutionUniformLocation, CONTAINER_WIDTH, CONTAINER_HEIGHT);

const texture = gl.createTexture();
texture.image = new Image();
texture.image.onload = function () {
  handleLoadedTexture(texture);
};
texture.image.src = './island.png';

function handleLoadedTexture(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);

}

function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
}

class DomImage {
  constructor() {
    this.speedX = 1 + Math.random() * 5;
    this.speedY = 2 + Math.random() * 10;
    this.transfromX = 0;
    this.transfromY = 0;
  }

  getPosBuffer() {
    return [
      this.transfromX, this.transfromY,
      this.transfromX + IMAGE_WIDTH, this.transfromY,
      this.transfromX, this.transfromY + IMAGE_HEIGHT,
      this.transfromX + IMAGE_WIDTH, this.transfromY + IMAGE_HEIGHT,
      this.transfromX + IMAGE_WIDTH, this.transfromY,
      this.transfromX, this.transfromY + IMAGE_HEIGHT,
    ]
  }

  getCordBuffer() {
    return [
      0, 0, 1, 0, 0, 1,
      1, 1, 1, 0, 0, 1,
    ];
  }

  update() {
    this.transfromX += this.speedX;
    this.transfromY += this.speedY;
    if (this.transfromX < 0 || this.transfromX > (CONTAINER_WIDTH - IMAGE_WIDTH)) {
      this.speedX *= -1;
    }
    if (this.transfromY < 0 || this.transfromY > (CONTAINER_HEIGHT - IMAGE_HEIGHT)) {
      this.speedY *= -1;
    }
    this.transfromX = clamp(this.transfromX, 0, CONTAINER_WIDTH - IMAGE_WIDTH);
    this.transfromY = clamp(this.transfromY, 0, CONTAINER_HEIGHT - IMAGE_HEIGHT);
  }
}

const images = [];

function addImgs(count) {
  for (let i = 0; i < count; i++) {
    images.push(new DomImage());
  }
  document.querySelector('p').innerHTML = `Image count: ${images.length}`
}

function updateImages() {
  if (images.length === 0) return requestAnimationFrame(updateImages);

  gl.clear(gl.COLOR_BUFFER_BIT);

  const posBufferData = [];
  const cordBufferData = [];
  images.forEach(d => {
    d.update();
    posBufferData.push(...d.getPosBuffer());
    cordBufferData.push(...d.getCordBuffer());
  });
  gl.bindBuffer(gl.ARRAY_BUFFER, cordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cordBufferData), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(posBufferData), gl.STATIC_DRAW);
  gl.drawArrays(gl.TRIANGLES, 0, images.length * 6);
  requestAnimationFrame(updateImages);
}
requestAnimationFrame(updateImages);

document.querySelector('#add10').onclick = () => addImgs(10);
document.querySelector('#add50').onclick = () => addImgs(50);
document.querySelector('#add100').onclick = () => addImgs(100);