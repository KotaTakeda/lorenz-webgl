function Controls(lorenz) {
    this.lorenz = lorenz;
    this.listeners = [];

    this.chain = [];
    this.button = null;

    // params of Lorenz 63
    var sigma = this.bind('#sigma', '#sigma-label', function(value) {
        return lorenz.params.sigma = value;
    })(lorenz.params.sigma);
    var beta = this.bind('#beta', '#beta-label', function(value) {
        return lorenz.params.beta = value;
    })(lorenz.params.beta);
    var rho = this.bind('#rho', '#rho-label', function(value) {
        return lorenz.params.rho = value;
    })(lorenz.params.rho);
    var noise = this.bind('#noise', '#noise-label', function(value) {
        return lorenz.params.noise = value;
    })(lorenz.params.noise);
    this.set_sigma = function(value) {
        lorenz.params.sigma = value;
        sigma(value);
    };
    this.set_beta = function(value) {
        lorenz.params.beta = value;
        beta(value);
    };
    this.set_rho = function(value) {
        lorenz.params.rho = value;
        rho(value);
    };
    this.set_noise = function(value) {
        lorenz.params.noise = value;
        noise(value);
    };
    
    // params of simulation
    var stepsize = this.bind('#stepsize', '#stepsize-label', function(value) {
        return lorenz.params.step_size = value;
    })(lorenz.params.step_size);
    var steprate = this.bind('#steprate', '#steprate-label', function(value) {
        return lorenz.params.steps_per_frame = value;
    })(lorenz.params.steps_per_frame);

    this.set_stepsize = function(value) {
        lorenz.params.step_size = value;
        stepsize(value);
    };
    this.set_steprate = function(value) {
        lorenz.params.steps_per_frame = value;
        steprate(value);
    };


    this.set_length = this.bind('#length', '#length-label', function(value) {
        var length = Math.pow(2, parseFloat(value));
        lorenz.length = length;
        return length;
    })({
        input: Math.log(lorenz.length) * Math.LOG2E,
        label: lorenz.length
    });

    var canvas = lorenz.gl.canvas;
    canvas.addEventListener('mousedown', function(e) {
        if (e.buttons) {
            this.button = e.buttons & 4 ? 'middle' : 'left';
            this.push({x: e.pageX, y: e.pageY});
        }
    }.bind(this));
    canvas.addEventListener('mousemove', function(e) {
        e.preventDefault();
        if (this.button) {
            this.push({x: e.pageX, y: e.pageY});
            var shift = e.shiftKey;
            var delta = null;
            if (this.button === 'middle') {
                /* Translate */
                delta = this.delta(1 / 40);
                if (shift)
                    this.lorenz.display.translation[2] += delta.y;
                else
                    this.lorenz.display.translation[0] += -delta.x;
                this.lorenz.display.translation[1] += delta.y;
            } else {
                this.lorenz.display.rotationd[0] = 0;
                this.lorenz.display.rotationd[1] = 0;
                this.lorenz.display.rotationd[2] = 0;
                delta = this.delta(1 / 20);
                if (e.shift)
                    lorenz.display.rotation[1] += -delta.x;
                else
                    lorenz.display.rotation[2] += delta.x;
                lorenz.display.rotation[0] += delta.y;
            }
        }
    }.bind(this));
    canvas.addEventListener('mouseup', function(e) {
        e.preventDefault();
        this.push({x: e.pageX, y: e.pageY});
        if (this.button != 'middle') {
            var delta = this.delta(1 / 20);
            if (e.shift)
                lorenz.display.rotationd[1] = -delta.x;
            else
                lorenz.display.rotationd[2] = delta.x;
            lorenz.display.rotationd[0] = delta.y;
        }
        this.chain.length = 0;
        this.button = null;
    }.bind(this));

    canvas.addEventListener('DOMMouseScroll', function(e) {
        e.preventDefault();
        this.lorenz.display.scale *= e.detail > 0 ? 0.95 : 1.1;
    }.bind(this));
    canvas.addEventListener('mousewheel', function(e) {
        e.preventDefault();
        this.lorenz.display.scale *= e.wheelDelta < 0 ? 0.95 : 1.1;
    }.bind(this));

    window.addEventListener('keypress', function(e) {
        if (e.which == 'a'.charCodeAt(0))
            this.add();
        else if (e.which == 'c'.charCodeAt(0))
            this.clone();
        else if (e.which == 'v'.charCodeAt(0))
            this.clone_circle();
        else if (e.which == 'C'.charCodeAt(0))
            this.clear();
        else if (e.which == ' '.charCodeAt(0))
            this.pause();
        else if (e.which == 'h'.charCodeAt(0))
            this.lorenz.display.draw_heads = !this.lorenz.display.draw_heads;
        else if (e.which == 'd'.charCodeAt(0))
            this.lorenz.display.damping = !this.lorenz.display.damping;
        else if (e.which == '['.charCodeAt(0) && lorenz.length > 4)
            this.set_length({
                input: Math.log(lorenz.length /= 2) * Math.LOG2E,
                label: lorenz.length
            });
        else if (e.which == ']'.charCodeAt(0) && lorenz.length < 32768)
            this.set_length({
                input: Math.log(lorenz.length *= 2) * Math.LOG2E,
                label: lorenz.length
            });
   }.bind(this));

    window.addEventListener('touchmove', function(e) {
        e.preventDefault();
        this.push({x: e.touches[0].clientX, y: e.touches[0].clientY});
        var delta = this.delta(1 / 20);
        this.lorenz.display.rotationd[0] = 0;
        this.lorenz.display.rotationd[1] = 0;
        this.lorenz.display.rotationd[2] = 0;
        this.lorenz.display.rotation[2] += delta.x;
        this.lorenz.display.rotation[0] += delta.y;
    }.bind(this));
    window.addEventListener('touchend', function(e) {
        var delta = this.delta(1 / 10); // small for more playfulness
        if (delta.x || delta.y) {
            this.lorenz.display.rotationd[2] = delta.x;
            this.lorenz.display.rotationd[0] = delta.y;
        } else {
            this.add();
        }
    }.bind(this));
}

Controls.prototype.push = function(e) {
    e.t = Date.now();
    this.chain.push(e);
};

Controls.prototype.delta = function(scale) {
    scale /= 1000;
    var stop = this.chain.length - 1;
    var start = stop;
    var dt = 0;
    while (dt === 0 && stop > 1) {
        stop--;
        dt = (this.chain[start].t - this.chain[stop].t) / 1000;
    }
    if (dt === 0)
        return {x: 0, y: 0}; // no delta!
    return {
        x: (this.chain[stop].x - this.chain[start].x) * scale / dt,
        y: (this.chain[stop].y - this.chain[start].y) * scale / dt
    };
};

Controls.prototype.add = function() {
    this.lorenz.add(Lorenz.generate());
    for (var n = 0; n < this.listeners.length; n++)
        this.listeners[n]();
};

Controls.prototype.clone = function() {
    var i = Math.floor(Math.random() * this.lorenz.solutions.length);
    var s = this.lorenz.solutions[i].slice(0);
    s[0] += (Math.random() - 0.5) / 10000;
    s[1] += (Math.random() - 0.5) / 10000;
    s[2] += (Math.random() - 0.5) / 10000;
    this.lorenz.add(s);
    for (var n = 0; n < this.listeners.length; n++)
        this.listeners[n]();
};

Controls.prototype.clone_cube = function() {
    var i = Math.floor(Math.random() * this.lorenz.solutions.length);
    var s = this.lorenz.solutions[i].slice(0);
    var cube = []
    for (var i = -1; i < 2; i++){
        for (var j = -1; j < 2; j++){
            for (var k = -1; k < 2; k++){
                if (i == 0 & j == 0 & k == 0){continue;}
                var c = s.concat()
                c[0] += i*0.0001;
                c[1] += j*0.0001;
                c[2] += k*0.0001;
                cube.push(c);
            }
        }
    }
    console.log(cube.length);
    this.lorenz.add_batch(cube);
    for (var n = 0; n < this.listeners.length; n++)
        this.listeners[n]();
};

Controls.prototype.clone_circle = function() {
    var s = this.lorenz.solutions[0].slice(0);
    var circle = [];
    var N = 128;
    var r = 3;
    var v1 = [1.0, 0.0, 0.0];
    var v2 = [0.0, 1.0, 0.0];

    for (var i = 0; i < N; i++){ 
        var theta = 2*Math.PI * i / N;
        var c = s.concat();
        c[0] += r*Math.cos(theta)*v1[0] + r*Math.sin(theta)*v2[0];
        c[1] += r*Math.cos(theta)*v1[1] + r*Math.sin(theta)*v2[1];
        c[2] += r*Math.cos(theta)*v1[2] + r*Math.sin(theta)*v2[2];
        circle.push(c);
    }
    this.lorenz.add_batch(circle);
    for (var n = 0; n < this.listeners.length; n++)
        this.listeners[n]();
};

Controls.prototype.clear = function() {
    this.lorenz.empty();
    for (var n = 0; n < this.listeners.length; n++)
        this.listeners[n]();
};

Controls.prototype.pause = function() {
    this.lorenz.params.paused = !this.lorenz.params.paused;
};

Controls.prototype.bind = function(input_selector, label_selector, f) {
    var input = document.querySelector(input_selector);
    var label = document.querySelector(label_selector);
    var handler = function(e) {
        label.textContent = f(parseFloat(input.value));
    };
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
    return function self(value) {
        if (typeof value === 'number') {
            input.value = value;
            label.textContent = value;
        } else {
            input.value = value.input;
            label.textContent = value.label;
        }
        return self;
    };
};
