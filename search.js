const xf = require('xfetch-js')
const opencc = require('node-opencc')

module.exports = keyword => {
	keyword = opencc.traditionalToSimplified(keyword)
	return xf.get(`http://v3api.dmzj.com/search/show/1/${encodeURIComponent(keyword)}/0.json`).json()
}
if (require.main === module) {
	module.exports(process.argv[2]).then(console.log, console.error)
}
