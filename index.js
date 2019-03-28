webglAPI = {
    data: {
        webGL: ""
    },
    shaders: {
        vertex: "shaders/vertex/test.glsl",
        fragment: "shaders/fragment/test.glsl",
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
        }
    },
    initWebGL() {
        // Инициализация canvas и получение из него WebGL контекста
        const canvas = document.createElement('canvas');
        document.body.appendChild(canvas);
        this.data.webGL = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        // Устанавливаем размеры canvas и вьюпорт у WebGL
        const size = Math.min(window.innerWidth, window.innerHeight);
        canvas.width = canvas.height = size;
        this.data.webGL.viewport(0, 0, size, size);
    },
    init: function () {
        this.shaders.loadAll().then(function (shaders) {
            webglAPI.initWebGL();
            let gl = webglAPI.data.webGL;

            let compiledShaders = [];
            for (type in shaders) {
                const shader = shaders[type];
                if (type === 'vertext') {
                    compiledShaders.push(webglAPI.shaders.compile(shader, gl.VERTEX_SHADER))
                } else if (type === 'fragment') {
                    compiledShaders.push(webglAPI.shaders.compile(shader, gl.FRAGMENT_SHADER))
                }
            }
            const program = gl.createProgram();
            compiledShaders.map(function (shader) {
                gl.attachShader(program, shader);
            })

            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.log('Could not initialize shaders');
            }

            const vertexBuffer = gl.createBuffer();
            const vertices = [0, 0, 0, 0.5, 1, 0, 1, 0, 0];
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            const colorBuffer = gl.createBuffer();
            const colors = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

// Получим местоположение переменных в программе шейдеров
            const uPosition = gl.getUniformLocation(program, 'u_position');
            const aPosition = gl.getAttribLocation(program, 'a_position');
            const aColor = gl.getAttribLocation(program, 'a_color');

// Укажем какую шейдерную программу мы намерены далее использовать
            gl.useProgram(program);

// Передаем в uniform-переменную положение треугольника
            gl.uniform3fv(uPosition, [0, 0, 0]);

// Связываем данные цветов
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.enableVertexAttribArray(aColor);
// Вторым аргументом передаём размерность, RGB имеет 3 компоненты
            gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);

// И вершин
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.enableVertexAttribArray(aPosition);
            gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

// Очищаем сцену, закрашивая её в белый цвет
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

// Рисуем треугольник
// Третьим аргументом передаём количество вершин геометрии
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        });
    }
};

webglAPI.init();