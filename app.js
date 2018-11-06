require('dotenv').config()
const path = require('path')
const fetchGet = require('./lib/fetchGet')
const rssPrep = require('./lib/feedItem')
const express = require('express')
const app = express()
app.disable('x-powered-by') // remove the 'X-Powered-By: Express' header

// register Handlebars view engine
app.set('view engine', 'handlebars')
const exphbs = require('express-handlebars')
app.engine('handlebars', exphbs())
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, '/views'))

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
