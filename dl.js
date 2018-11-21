const path = require('path')
const xf = require('xfetch-js')
const opencc = require('node-opencc')
const cheerio = require('cheerio')
const Epub = require('epub-gen')

const download = (book, vol, chep) => xf.get(`http://v3api.dmzj.com/novel/download/${book}_${vol}_${chep}.txt`).text()
const sanitize = str => {
	const $ = cheerio.load(str)
	$('br').replaceWith('\n')
	return $.text().replace(/\n{2,}/g, '\n')
}
const getData = async id => {
	const vols = await xf.get(`http://v3api.dmzj.com/novel/chapter/${id}.json`).json()
	const res = []
	for (const vol of vols) {
		const cp = vol.chapters.map(async chep => ({
			title: chep.chapter_name,
			data: await download(id, vol.id, chep.chapter_id)
		}))
		res.push({
			title: vol.volume_name,
			data: await Promise.all(cp)
		})
	}
	return res
}

exports.getTxt = async id => {
	const res = await getData(id)
	const ar = []
	for (const vol of res) {
		ar.push.apply(ar, vol.data.map(chep => sanitize(chep.data) + '\n\n'))
		ar.push('\n\n\n\n\n')
	}
	return opencc.simplifiedToTaiwan(ar.join(''))
}
exports.getEpub = async (id, output) => {
	const res = await getData(id)
	const meta = await xf.get(`http://v3api.dmzj.com/novel/${id}.json`).json()
	const opts = {
		title: opencc.simplifiedToTaiwan(meta.name),
		author: meta.authors,
		cover: meta.cover,
		output,
		lang: 'zh',
		tocTitle: '目錄',
		content: res.map(vol => ({
			title: vol.title,
			data: opencc.simplifiedToTaiwan(vol.data.map(chep => chep.data + '\n\n\n').join(''))
		})),
		fonts: [path.join(__dirname, './notosanscjktc.otf')]
	}
	return new Epub(opts)
}
if (require.main === module) {
	exports.getEpub(process.argv[2], path.join(process.cwd(), process.argv[3])).then(console.log, console.error)
}
