# README #

## Intro

Since I didn't had much time and it is simple showcase of few of my skills i just kept it as simple as possible.
Also I decided to include some of other code samples in `misc` folder so feel free to check.

This exercise consists of small server part and frontend app.
 
I decided not to invest any time into env-based configuration of server side as well as in to creating docker image or any deployment flow.
You also wont find any build processes based on grunt/gulp. I did small things with npm scrips which is pretty much a good stable interface which could call grunt / gulp / webpack / you name it.

No jshint/eslint installed as well as rc-dot-files because IDE is doing it for me. In case of CI pupeline I would have it in repo, ofc. 
 
Scallability wise server.js is not really scallable. To make it scallable with WebSocket I would need nginx/HAProxy in front all of NodeJS nodes which would have a sticky WS connection. LB could be done via round robin.
This way it could scale horizontaly, but I would need data sharing via Master-Slave DB, Hazelcast, etc.
Also I can user "node cluster" (what a confusing name *sigh*) to scale vertically but that wont work well with docker or any other container.

Btw, there is no ACL, auth or authorization whatsoever. Sorry JWT/OAuth.

Last but not least functionality wise there is no history, re-broadcasting if someone joins later, no rooms, no p2p chats, etc... 

### Installation

`npm i`

### Run

`npm start`

### How to join

Just open same URL several times for multi-party chat.

### How to test

`npm test`

Simple unit test. For the rest of functionality I would have to write some e2e integration test or mock things out.
It is an overkill for this scope, imo, just because it is a sample app to show a glimpse of "idea".

<br><br>
**GL HF**
