function domManipulations() {
	const el = document.createElement('h1');
	el.textContent = 'worker added this h1' + self.isWorker;
	document.body.append(el);
}

function loggingGlobals() {
	console.log('window:', window);
	console.log('document:', document);
	console.log('innerWidth:', innerWidth);
	console.log('document.title:', document.title);
	window.xxx = {
		x: 1,
		y: 2,
		z: 3,
	};
	// const keys = Object.keys(window);
	// console.log('keys', keys);
	console.log('keys length', keys.length);
	console.log(window.xxx);
	console.log(Object.keys(window.xxx));
}

function appendScripts() {
	const script = document.createElement('script');
	script.src = '/third-party-scripts/bar.js';
	document.body.append(script);
}

function usingEventHandlers() {
	window.addEventListener('click', event => {
		console.log('event is', event, event.clientX, event.clientY);
	});
}

function prototypes() {
	function Zoo() {
		this.x = 10;
	}

	Zoo.prototype.hi = function () {
		console.log('hi!!', this.x);
	};

	const foo = new Zoo();
	foo.hi();
}

function prototypes2() {
	function Foo() {
		this.x = 10;
	}

	Foo.prototype.hi = function () {
		console.log('hi!!', this.x);
	};

	const foo = new Foo();

	window.x = {
		foo,
	};

	const y = window.x;
	console.log('y is', y);
	y.foo.hi();
}

function settingGlobals() {
	window.x = {
		foo: 'this is x.foo',
		bar(foo) {
			console.log('this is bar', foo);
		},
	};
	console.log(window.x.foo);
	window.x.bar('called within worker');
}

// settingGlobals();
// prototypes();
// prototypes2();

loggingGlobals();
// domManipulations();
// appendScripts();
// usingEventHandlers();
