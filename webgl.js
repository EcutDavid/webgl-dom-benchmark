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
    gl_FragColor = vec4(gl_FragColor.rgb, gl_FragColor.a * 0.3);
    gl_FragColor.rgb *= gl_FragColor.a;
  }
`;

const gl = document.querySelector('canvas').getContext('webgl');

gl.enable(gl.BLEND);
gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

gl.clearColor(1, 1, 1, 1);
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
setupTexture();

function handleLoadedTexture(texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
}

function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
}

class GLImage {
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
    images.push(new GLImage());
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

document.querySelector('#add50').onclick = () => addImgs(50);
document.querySelector('#add100').onclick = () => addImgs(100);
document.querySelector('#add1000').onclick = () => addImgs(1000);
addImgs(10);
function setupTexture() {
  const texture = gl.createTexture();
  texture.image = new Image();
  texture.image.onload = function () {
    handleLoadedTexture(texture);
  };
  texture.image.src = 'data:image/png;base64, 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';
}