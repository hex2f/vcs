
module main

import vweb
import rand

const (
	port = 80
)

struct App {
	vweb.Context
}

fn main() {
	vweb.run<App>(port)
}

pub fn (mut app App) index() vweb.Result {
	j := new_compilation_job(app.query['code']) or { return app.text(err.msg) }
	j.compile()
	j.cleanup() or { return app.text(err.msg) }
	return app.text(j.str())
}

[post]
pub fn (mut app App) post() vweb.Result {
	return app.text('Post body: $app.req.data')
}