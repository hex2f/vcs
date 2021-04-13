module main

import os
import rand

struct CompilationJob {
	id	 		string
	path 		string
	code_path 	string
	code 		string
}

fn temp_path(id string) string {
	return os.join_path(os.temp_dir(), id)
}

fn new_compilation_job(code string) ?CompilationJob {
	id := rand.string(18)
	j := CompilationJob {
		id: id
		path: temp_path(id)
		code: code
	}

	os.mkdir(j.path) or { return error('failed to create temp dir') }
	os.write_file(j.get_ext_path('v'), j.code) or { return error('failed to write code to temp') }

	return j
}

fn (j CompilationJob) get_ext_path(ext string) string {
	return os.join_path(j.path, '${j.id}.${ext}')
}

fn (j CompilationJob) compile() {
	v_res := os.exec('v -o ${j.get_ext_path('c')} ${j.get_ext_path('v')}') or { panic(err) }
	println(v_res.str())
	clang_res := os.exec('./wasi-sdk-12.0/bin/clang -w -O3 -D__linux__ \
	-target wasm32-unknown-wasi \
	--sysroot "./wasi-sdk-12.0/share/wasi-sysroot" \
	-D_WASI_EMULATED_SIGNAL \
	-lwasi-emulated-signal \
	-Iinclude \
	-Wl,--allow-undefined \
	-o $j.path/compiled.wasm \
	${j.get_ext_path('c')} placeholders.c') or { panic(err) }
	println(clang_res.str())
}

fn (j CompilationJob) cleanup() ? {
	os.rmdir_all(j.path) or { return error('failed to remove temp dir') }
}