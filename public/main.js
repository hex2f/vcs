import {WASI} from "https://jspm.dev/@wasmer/wasi@0.11.2"
import bindings from "https://jspm.dev/@wasmer/wasi@0.11.2/lib/bindings/browser"
import {WasmFs} from "https://jspm.dev/@wasmer/wasmfs@0.11.2"
import path from "https://jspm.dev/@jspm/core@2/nodelibs/path"
import {PassThrough} from "https://jspm.dev/@jspm/core@2/nodelibs/stream"
import fsn from "https://jspm.dev/@jspm/core@2/nodelibs/fs"
import {lowerI64Imports, wasmTransformerInit} from "https://unpkg.com/@wasmer/wasm-transformer@0.11.2/lib/optimized/wasm-transformer.esm.js"
import Import from "https://jspm.dev/dynamic-import-polyfill@0.1.1"

Import.initialize()

let createProxy = () => new Proxy({}, {
	get: (object, key) => {
		if (typeof key === "symbol" || key in object) return object[key]
		return (...args) => { throw new Error(`${key} was called as a (${args.join(", ")})`) }
	},
})

function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

const runButton = document.getElementById('run')

let main = async () => {
	fsn.constants = {}
	
	await wasmTransformerInit("https://unpkg.com/@wasmer/wasm-transformer@0.11.2/lib/wasm-pack/web/wasm_transformer_bg.wasm")

	let compiled = await (await fetch('http://206.189.5.243/wasm?code=')).text()

	let module = await WebAssembly.compile(await lowerI64Imports(_base64ToArrayBuffer(compiled)))
	
	runButton.disabled = false

	runButton.addEventListener("click", async () => {
		output.textContent = ""
		
		let {fs} = new WasmFs()
		fs.writeFileSync("/v", "v")
		fs.mkdirSync("/proc/self", {recursive: true})
		fs.symlinkSync("/v", "/proc/self/exe")
		
		path.win32 = path
		Object.assign(fsn, fs)
		
		// let stream = new PassThrough()
		// stream.pipe(tar.extract({sync: true, cwd: "/"}))
		// stream.end(vlib)
		
		let success = true
		
		let wasi = new WASI(
		{
			args: [""],
			bindings:
			{
				...bindings,
				fs, path,
				hrtime: () => 0,
				exit: status => status && (success = false),
			},
			preopens:  {"/": "/", ".": "/"},
		})
		
		runButton.disabled = true
		
		let instance = await WebAssembly.instantiate(module, {...wasi.getImports(module), env: createProxy()})
		let {exports: {memory}} = instance
		
		runButton.disabled = false
		
		let appendError = error => {
			output.append("\n")
			if (error instanceof Error) output.append(error.stack)
			else output.append(String(error))
		}
		
		try { wasi.start(instance) }
		catch (error) { appendError(error); success = false }
		
		if (success)
		{
			let stdout = await fs.readFileSync('/dev/stdout', 'utf-8')
			output.append("\n", fs.readFileSync(2, "utf-8"))
			output.append("\n", stdout)
		}
		else
		{
			output.append("\n", fs.readFileSync(2, "utf-8"))
		}
	})
}

main()
