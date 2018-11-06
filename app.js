require('dotenv').config()
const path = require('path')
const fetchGet = require('./lib/fetchGet')
const express = require('express')
const app = express()
app.disable('x-powered-by') // remove the 'X-Powered-By: Express' header
app.set('json spaces', 2) // basic pretty-print

// Register Handlebars view engine
app.set('view engine', 'handlebars')
const exphbs = require('express-handlebars')
app.engine('handlebars', exphbs())
app.set('view engine', 'handlebars')

// default to pug for rendering
// app.set('view engine', 'pug')
app.set('views', path.join(__dirname, '/views'))


const rssPrep = require('./lib/feeditem')

// app.get('/r/:subreddit/time/:time/:limit', async (req, res) => {
// 	try {
// 		let subreddit = req.params.subreddit
// 		let time = req.params.time
// 		let limit = req.params.limit

// 		const feed = `https://www.reddit.com/r/${subreddit}/top/.json?sort=top&t=${time}&limit=${limit}`

// 		let json = await fetchGet(feed)
// 		let jsonArray = json.data.children 

// 		let rssObjects = []
// 		jsonArray.forEach(async (entry) => {
// 			let rss = new RssItem(entry)
// 			await rss.init2()
// 			console.log(rss)
// 			rssObjects.push(rss)
// 		})

// 		res.set('Content-Type', 'application/rss+xml')
// 		res.render('rss', {
// 			doctype:'xml',
// 			data: {
// 				subreddit: jsonArray[0].data.subreddit,
// 				link: jsonArray[0].data.subreddit,
// 				items:  await rssObjects
// 			}
// 		})
// 	} catch (ex) {
// 		console.error(ex)
// 	}

// })

app.get('/r/:subreddit/time/:time/:limit', async (req, res) => {
	try {
		let subreddit = req.params.subreddit
		let time = req.params.time
		let limit = req.params.limit

		const feed = `https://www.reddit.com/r/${subreddit}/top/.json?sort=top&t=${time}&limit=${limit}`

		let json = await fetchGet(feed)
		let rssObjects = rssPrep.buildObjects(json)
		let rssMomma = {
			subreddit: subreddit,
			canonical: `https://reddit.com/r/${subreddit}`,
			items: rssObjects
		}

		res.set('Content-Type', 'application/rss+xml')
		res.render('rss', rssMomma)
	} catch (ex) {
		console.error(ex)
	}

})


module.exports = app
