
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

['/wasm']
pub fn (mut app App) index() vweb.Result {
	j := new_compilation_job(app.query['code']) or { return app.text(err.msg) }
	j.compile()
	wasm := j.encode() or { return app.text(err.msg) }
	j.cleanup() or { return app.text(err.msg) }
	app.add_header('access-control-allow-origin', '*')
	return app.text(wasm)
}

[post]
pub fn (mut app App) post() vweb.Result {
	return app.text('Post body: $app.req.data')
}