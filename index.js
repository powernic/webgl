webglAPI = {
    data: {
        webGL: "",
        lastRenderTime: 0,
        objects: null
    },
    textures: {
        texture: null,
        textureBuffer: null,
        frameRender: function(){
            const gl = webglAPI.data.webGL;

        },
        handleLoadedTexture: function (texture) {
            const gl = webglAPI.data.webGL;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);

        },
        initBuffer: function () {
            const gl = webglAPI.data.webGL;
            this.textureBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);

            const textureCoords = [
                // Front face
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,

                // Back face
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,

                // Top face
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,

                // Bottom face
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0,

                // Right face
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,

                // Left face
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
            this.textureBuffer.itemSize = 2;
            this.textureBuffer.numItems = 24;
            return this.textureBuffer;
        },
        files: {texture1: "images/texture1.jpg"},
        init: function (textureName) {
            const texture = webglAPI.data.webGL.createTexture();
            texture.image = new Image();
            texture.image.onload = function () {
                webglAPI.textures.handleLoadedTexture(texture)
            };
            texture.image.src = this.files[textureName];
            this.texture = texture;
        }
    },
    shaders: {
        program: null,
        vertex: "shaders/vertex/cube.glsl",
        fragment: "shaders/fragment/cube.glsl",
        compile: function (shader, type) {
            let gl = webglAPI.data.webGL;
            const shaderElement = gl.createShader(type);
            gl.shaderSource(shaderElement, shader);
            gl.compileShader(shaderElement);

            if (!gl.getShaderParameter(shaderElement, gl.COMPILE_STATUS)) {
                console.log(gl.getShaderInfoLog(shaderElement));
            }
            return shaderElement;
        },
        get: function (script) {
            return new Promise(function (resolve, reject) {
                const xhr = new XMLHttpRequest;
                xhr.onload = function () {
                    resolve(xhr.responseText);
                };
                xhr.onerror = reject;
                xhr.open("GET", script);
                xhr.send();
            });
        },
        loadAll: function () {
            const shaders = [this.get(this.vertex), this.get(this.fragment)];
            const names = ['vertext', 'fragment'];

            return Promise.all(shaders).then(function (results) {
                let obj = {};
                names.forEach(function (name, i) {
                    obj[name] = results[i];
                });
                return obj;
            });
        },
        initProgram: function (compiledShaders) {
            let gl = webglAPI.data.webGL;
            const program = gl.createProgram();
            compiledShaders.map(function (shader) {
                gl.attachShader(program, shader);
            });

            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.log('Could not initialize shaders');
            }
            this.program = program;
        },
        init: function (shaders) {

            let gl = webglAPI.data.webGL;
            let compiledShaders = [];
            for (type in shaders) {
                const shader = shaders[type];
                if (type === 'vertext') {
                    compiledShaders.push(this.compile(shader, gl.VERTEX_SHADER))
                } else if (type === 'fragment') {
                    compiledShaders.push(this.compile(shader, gl.FRAGMENT_SHADER))
                }
            }
            return compiledShaders;
        }
    },
    initWebGL() {
        // Инициализация canvas и получение из него WebGL контекста
        const canvas = document.createElement('canvas');
        document.body.appendChild(canvas);
        this.data.webGL = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        // Устанавливаем размеры canvas и вьюпорт у WebGL
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        this.data.webGL.viewport(0, 0, window.innerWidth, window.innerHeight);
    },
    objects: {
        camera: {
            matrix: null,
            position: null,
            getPosition: function () {
                return this.position;
            },
            getMatrix: function () {
                return this.matrix;
            },
            initShader() {
                const gl = webglAPI.data.webGL;
                this.position = gl.getUniformLocation(webglAPI.shaders.program, 'u_camera');
            },
            initBuffer: function () {

            },
            init: function () {
                this.matrix = glMatrix.mat4.create();
                glMatrix.mat4.perspective(this.matrix, 0.785, window.innerWidth / window.innerHeight, 0.1, 1000);
                glMatrix.mat4.translate(this.matrix, this.matrix, [0, 0, -5]);
                return this;
            },
            frameRender: function () {
            }
        },
        cube: {
            size: 1,
            vertexBuffer: [],
            countVertexes: 24,
            position: null,
            matrix: null,
            sampler: null,
            aVertexPosition: null,
            aTextureCoord: null,
            vertexIndexBuffer: null,
            initShader() {
                const program = webglAPI.shaders.program;
                const gl = webglAPI.data.webGL;
                // Получим местоположение переменных в программе шейдеров
                this.position = gl.getUniformLocation(program, 'u_cube');
                this.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
                gl.enableVertexAttribArray(this.aVertexPosition);
                this.sampler = gl.getUniformLocation(program, 'uSampler');
                this.aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');
                gl.enableVertexAttribArray(this.aTextureCoord);
            },
            initBuffer() {
                const gl = webglAPI.data.webGL;
                this.vertexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.getVertexes()), gl.STATIC_DRAW);
                this.vertexBuffer.itemSize = 3;
                this.vertexBuffer.numItems = 24;

                this.vertexIndexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
                const cubeVertexIndices = [
                    0, 1, 2, 0, 2, 3,    // Front face
                    4, 5, 6, 4, 6, 7,    // Back face
                    8, 9, 10, 8, 10, 11,  // Top face
                    12, 13, 14, 12, 14, 15, // Bottom face
                    16, 17, 18, 16, 18, 19, // Right face
                    20, 21, 22, 20, 22, 23  // Left face
                ];
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
                this.vertexIndexBuffer.itemSize = 1;
                this.vertexIndexBuffer.numItems = 36;

            },
            init: function (size) {
                const gl = webglAPI.data.webGL;
                this.size = size | 1;
                // Создадим единичную матрицу положения куба
                this.matrix = glMatrix.mat4.create();

                return this;
            },
            getPosition: function () {
                return this.position;
            },
            getMatrix: function () {
                return this.matrix;
            },
            frameRender: function (dt) {
                let gl = webglAPI.data.webGL;
                // Вращаем куб относительно оси Y
                glMatrix.mat4.rotateY(this.matrix, this.matrix, dt / 1000);
                // Вращаем куб относительно оси Z
                glMatrix.mat4.rotateZ(this.matrix, this.matrix, dt / 1000);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

                gl.vertexAttribPointer(this.aVertexPosition, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);


                gl.bindBuffer(gl.ARRAY_BUFFER, webglAPI.textures.textureBuffer);
                gl.vertexAttribPointer(this.aTextureCoord,webglAPI.textures.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

                webglAPI.textures.frameRender();

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, webglAPI.textures.texture);
                gl.uniform1i(this.sampler, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);

            },
            getVertexes: function () {
                return [
                    // Передняя грань
                    -1.0, -1.0,  1.0,
                    1.0, -1.0,  1.0,
                    1.0,  1.0,  1.0,
                    -1.0,  1.0,  1.0,

                    // Back face
                    -1.0, -1.0, -1.0,
                    -1.0,  1.0, -1.0,
                    1.0,  1.0, -1.0,
                    1.0, -1.0, -1.0,

                    // Top face
                    -1.0,  1.0, -1.0,
                    -1.0,  1.0,  1.0,
                    1.0,  1.0,  1.0,
                    1.0,  1.0, -1.0,

                    // Bottom face
                    -1.0, -1.0, -1.0,
                    1.0, -1.0, -1.0,
                    1.0, -1.0,  1.0,
                    -1.0, -1.0,  1.0,

                    // Right face
                    1.0, -1.0, -1.0,
                    1.0,  1.0, -1.0,
                    1.0,  1.0,  1.0,
                    1.0, -1.0,  1.0,

                    // Left face
                    -1.0, -1.0, -1.0,
                    -1.0, -1.0,  1.0,
                    -1.0,  1.0,  1.0,
                    -1.0,  1.0, -1.0,

                ];
            },
        }
    },
    renderFrame: function () {
        const objects = webglAPI.data.objects;

        // Запрашиваем рендеринг на следующий кадр
        requestAnimationFrame(webglAPI.renderFrame);
        let gl = webglAPI.data.webGL;

        // Получаем время прошедшее с прошлого кадра
        const time = Date.now();
        const dt = webglAPI.data.lastRenderTime - time;
        gl.useProgram(webglAPI.shaders.program);
        //вызываем окшены в каждом объекте
        for (let i = 0; i < objects.length; i++) {
            object = objects[i];
            object.frameRender(dt);
            gl.uniformMatrix4fv(object.getPosition(), false, object.getMatrix());
        }
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
        webglAPI.data.lastRenderTime = time;
    },
    initObjects: (objects) => {
        webglAPI.data.objects = [];
        for (let i = 0; i < objects.length; i++) {
            webglAPI.data.objects.push(webglAPI.objects[objects[i]].init());
        }
    },
    initShaders: function (shaders) {
        const compiledShaders = webglAPI.shaders.init(shaders);
        const gl = webglAPI.data.webGL;
        webglAPI.shaders.initProgram(compiledShaders);
        gl.useProgram(webglAPI.shaders.program);
        const objects = webglAPI.data.objects;
        for (let i = 0; i < objects.length; i++) {
            objects[i].initShader();
        }

    },
    initBuffers: function () {
        const objects = webglAPI.data.objects;
        for (let i = 0; i < objects.length; i++) {
            objects[i].initBuffer();
        }
        webglAPI.textures.initBuffer()

    },
    init: function () {
        this.shaders.loadAll().then(function (shaders) {
            webglAPI.initWebGL();
            webglAPI.initObjects(['camera', 'cube']);
            webglAPI.initShaders(shaders);
            webglAPI.initBuffers();
            webglAPI.textures.init("texture1");
            webglAPI.data.lastRenderTime = Date.now();
            webglAPI.renderFrame();
            const gl = webglAPI.data.webGL;
            // Очищаем сцену, закрашивая её в белый цвет
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            // Включаем фильтр глубины
            gl.enable(gl.DEPTH_TEST);
        });
    }
};

webglAPI.init();