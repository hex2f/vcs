
module main

import vweb

const (
	port = 80
)

struct App {
	vweb.Context
}

fn main() {
	vweb.run<App>(port)
}

pub fn (mut app App) init_once() {
	app.handle_static('./public', true)
}

[post]
['/wasm']
pub fn (mut app App) index() vweb.Result {
	j := new_compilation_job(app.req.data) or { return app.text(err.msg) }
	j.compile()
	wasm := j.encode() or { return app.text(err.msg) }
	j.cleanup() or { return app.text(err.msg) }
	app.add_header('access-control-allow-origin', '*')
	return app.text(wasm)
}