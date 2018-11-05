const fetch = require('node-fetch')


const fetchGet = async (url) => {
	try {
		const config = {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
		}
		const response = await fetch(url, config)
		if (response.ok) {
			const data = await response.json()
			// console.log(data)
			return data
		}
		throw new Error(`${response.status} ${response.statusText}`)
	} catch (ex) {
		console.log(`${ex}, ${ex.stack}`)
	}
}


module.exports = fetchGet
