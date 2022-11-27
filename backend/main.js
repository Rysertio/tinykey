import { Router } from './itty-router.js'
import { db } from './dbservice.js'

// now let's create a router (note the lack of "new")
const router = Router()

router.get('/.well-known/webfinger', webfinger)

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }))

// attach the router "handle" to the event handler
addEventListener('fetch', event =>
    event.respondWith(router.handle(event.request))
)

function webfinger(request, env) {
    let resource = request.query.resource;
    if (!resource || !resource.includes('acct:')) {
        return res.status(400).send('Bad request. Please make sure "acct:USER@DOMAIN" is what you are sending as the "resource" query parameter.');
    }
    else {
        let name = resource.replace('acct:', '');
        let result = db.prepare('select webfinger from accounts where name = ?').get(name);
        if (result === undefined) {
            return res.status(404).send(`No record found for ${name}.`);
        }
        else {
            res.json(JSON.parse(result.webfinger));
        }
    }
}