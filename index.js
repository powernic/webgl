webglAPI = {
    data: {
        webGL: "",
        lastRenderTime: 0,
        objects: null
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
            init: function () {
                let gl = webglAPI.data.webGL;
                this.matrix = glMatrix.mat4.create();
                glMatrix.mat4.perspective(this.matrix, 0.785, window.innerWidth / window.innerHeight, 0.1, 1000);
                glMatrix.mat4.translate(this.matrix, this.matrix, [0, 0, -5]);
                this.position = gl.getUniformLocation(webglAPI.shaders.program, 'u_camera');
                return this;
            },
            frameRender: function () {

            }
        },
        cube: {
            size: 1,
            vertexBuffer: [],
            colorBuffer: [],
            countVertexes: 36,
            position: null,
            matrix: null,
            aPosition: null,
            aColor: null,
            init: function (size) {
                const program = webglAPI.shaders.program;
                const gl = webglAPI.data.webGL;
                this.size = size | 1;
                this.vertexBuffer = gl.createBuffer();
                this.colorBuffer = gl.createBuffer();
                // Создадим единичную матрицу положения куба
                this.matrix = glMatrix.mat4.create();
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.getVertexes()), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.getColors()), gl.STATIC_DRAW);


                // Получим местоположение переменных в программе шейдеров
                this.position = gl.getUniformLocation(program, 'u_cube');
                this.aPosition = gl.getAttribLocation(program, 'a_position');
                this.aColor = gl.getAttribLocation(program, 'a_color');
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
                gl.enableVertexAttribArray(this.aPosition);
                gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
                gl.enableVertexAttribArray(this.aColor);
                gl.vertexAttribPointer(this.aColor, 3, gl.FLOAT, false, 0, 0);
            },
            getVertexes: function () {
                return [
                    // Передняя грань
                    -this.size, -this.size, -this.size,
                    this.size, -this.size, -this.size,
                    -this.size, -this.size, this.size,

                    this.size, -this.size, this.size,
                    -this.size, -this.size, this.size,
                    this.size, -this.size, -this.size,

                    // Задняя грань
                    -this.size, this.size, -this.size,
                    -this.size, this.size, this.size,
                    this.size, this.size, -this.size,

                    this.size, this.size, this.size,
                    this.size, this.size, -this.size,
                    -this.size, this.size, this.size,

                    // Нижняя грань
                    -this.size, -this.size, -this.size,
                    -this.size, this.size, -this.size,
                    this.size, -this.size, -this.size,

                    this.size, this.size, -this.size,
                    this.size, -this.size, -this.size,
                    -this.size, this.size, -this.size,

                    // Верхняя грань
                    -this.size, -this.size, this.size,
                    this.size, -this.size, this.size,
                    -this.size, this.size, this.size,

                    this.size, this.size, this.size,
                    -this.size, this.size, this.size,
                    this.size, -this.size, this.size,

                    // Левая грань
                    -this.size, -this.size, -this.size,
                    -this.size, -this.size, this.size,
                    -this.size, this.size, -this.size,

                    -this.size, this.size, this.size,
                    -this.size, this.size, -this.size,
                    -this.size, -this.size, this.size,

                    // Правая грань
                    this.size, -this.size, -this.size,
                    this.size, this.size, -this.size,
                    this.size, -this.size, this.size,

                    this.size, this.size, this.size,
                    this.size, -this.size, this.size,
                    this.size, this.size, -this.size
                ];
            },
            getColors: function () {
                return [
                    // Передняя грань
                    1, 0.5, 0.5,
                    1, 0.5, 0.5,
                    1, 0.5, 0.5,
                    1, 0.5, 0.5,
                    1, 0.5, 0.5,
                    1, 0.5, 0.5,

                    // Задняя грань
                    1, 0.5, 0.5,
                    1, 0.5, 0.5,
                    1, 0.5, 0.5,
                    1, 0.5, 0.5,
                    1, 0.5, 0.5,
                    1, 0.5, 0.5,

                    // Нижняя грань
                    0.5, 0.7, 1,
                    0.5, 0.7, 1,
                    0.5, 0.7, 1,
                    0.5, 0.7, 1,
                    0.5, 0.7, 1,
                    0.5, 0.7, 1,

                    // Верхняя грань
                    0.5, 0.7, 1,
                    0.5, 0.7, 1,
                    0.5, 0.7, 1,
                    0.5, 0.7, 1,
                    0.5, 0.7, 1,
                    0.5, 0.7, 1,

                    // Левая грань
                    0.3, 1, 0.3,
                    0.3, 1, 0.3,
                    0.3, 1, 0.3,
                    0.3, 1, 0.3,
                    0.3, 1, 0.3,
                    0.3, 1, 0.3,

                    // Правая грань
                    0.3, 1, 0.3,
                    0.3, 1, 0.3,
                    0.3, 1, 0.3,
                    0.3, 1, 0.3,
                    0.3, 1, 0.3,
                    0.3, 1, 0.3
                ];
            }
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
        // Очищаем сцену, закрашивая её в белый цвет
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Включаем фильтр глубины
        gl.enable(gl.DEPTH_TEST);
        gl.useProgram(webglAPI.shaders.program);
        //вызываем окшены в каждом объекте
        for (let i = 0; i < objects.length; i++) {
            object = objects[i];
            object.frameRender(dt);
            gl.uniformMatrix4fv(object.getPosition(), false, object.getMatrix());
        }

        gl.drawArrays(gl.TRIANGLES, 0, 36);
        webglAPI.data.lastRenderTime = time;
    },
    initObjects: (objects) => {
        webglAPI.data.objects = [];
        for (let i = 0; i < objects.length; i++) {
            webglAPI.data.objects.push(webglAPI.objects[objects[i]].init());
        }
    },
    init: function () {
        this.shaders.loadAll().then(function (shaders) {
            webglAPI.initWebGL();
            let gl = webglAPI.data.webGL;
            const compiledShaders = webglAPI.shaders.init(shaders);
            webglAPI.shaders.initProgram(compiledShaders);
            webglAPI.initObjects(['camera', 'cube']);
            webglAPI.data.lastRenderTime = Date.now();
            webglAPI.renderFrame();
        });
    }
};

webglAPI.init();