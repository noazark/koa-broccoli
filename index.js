// mostly taken from broccoli.js
// https://github.com/joliss/broccoli/blob/9106a1db42933491515c6ec9cf7c1188850ecbba/lib/server.js

var broccoli = require('broccoli')
var liveReload = require('tiny-lr')
var send = require('koa-send')
var Watcher = require('broccoli/lib/watcher')

module.exports = broccoliServer

function broccoliServer(options) {
	if (options == null) {
		options = {}
	}

	// default options
	var liveReloadPort = options.liveReloadPort || 35729

	var tree = broccoli.loadBrocfile()
	var builder = new broccoli.Builder(tree)
	var watcher = new Watcher(builder)
	var liveReloadServer = new liveReload.Server()

	// cleanup before exit
	process.addListener('exit', function () {
		builder.cleanup()
	})

	process
		.on('SIGINT', function () { process.exit(1) })
		.on('SIGTERM', function () { process.exit(1) })

	liveReloadServer.listen(options.liveReloadPort, function (err) {
		if(err) {
			throw err
		}
	})

	var reload = function () {
		liveReloadServer.changed({body: {files: ['LiveReload files']}})
	}

	watcher.on('change', function (dir) {
		console.log('Built')
		reload()
	})

	watcher.on('error', function (err) {
		console.log('Built with error:')
		console.log(err.stack)
		console.log('')
		reload()
	})

	return function* middleware() {
		var directory = yield watcher

		yield send(this, this.path, { root: directory })
	}
}
