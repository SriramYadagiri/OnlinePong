const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");

const w = 25;
const h = w*5;

var username = document.getElementById("username");
var playerColor = document.getElementById("player-color");
var submitButton = document.getElementById("submit");
var waiting = document.getElementById("waiting");
var player;
var playerX;

var keys = [];
document.addEventListener("keydown", (e) => {
    keys[e.keyCode] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.keyCode] = false;
});

const database = firebase.database();
var playerCount = 0;
var playersRef = database.ref('/players');
var ballRef = database.ref('/ball');

var ball = {
    w: 25,
    h: 25,
    x: canvas.width/2-25/2,
    y: canvas.height/2-25/2,
    color: "white",
    vx: 0,
    vy: 0,
}

ballRef.set(ball);
var playerCountRef = database.ref('playerCount');

var players = [];

window.addEventListener('beforeunload', () => {
    if(document.getElementById("form").style.display == "none") {
        disconnected();
    }
})

submitButton.addEventListener('click', (e) => {
    document.getElementById("form").style.display = "none";
    waiting.style.display = "block";
    playerCountRef.set(playerCount+1);
    if(playerCount<2)playerX = 0;
    else if(players[0].x == 0)playerX = canvas.width-w;
    else playerX = 0;
    player = playerCount-1; 
    playersRef.child(username.value).set({
        username: username.value,
        color: playerColor.value,
        x: playerX,
        y: canvas.height/2-h/2,
        w: w,
        h: h,
    });
});

var loop;

function draw(){
    loop = requestAnimationFrame(draw);
    rect(0, 0, canvas.width, canvas.height);
    ballSet("x", ball.x+ball.vx);
    ballSet("y", ball.y+ball.vy);
    if(ball.x<0) {
        text(players[1].username + " Has Won!", canvas.width/2, canvas.height/2-200, players[0].color, "Arial", 25,);
        cancelAnimationFrame(loop);
        setTimeout(disconnected, 1750);
    } else if(ball.x+ball.w>canvas.width) {
        text(players[0].username + " Has Won!", canvas.width/2, canvas.height/2, players[1].color, "Arial", 25,);
        cancelAnimationFrame(loop);
        setTimeout(disconnected, 2000);
    }
    if(ball.y<=0 || ball.y+ball.h>=canvas.height)ballSet("vy", ball.vy*-1);
    rect(ball.x, ball.y, ball.w, ball.w, "white", true);
    for(var i = 0; i<players.length; i++) {
        var plr = players[i];
        rect(plr.x, plr.y, w, h, plr.color, true);
        collide(ball, plr)
        if(plr.x==canvas.width-w){
            text(plr.username, plr.x-100, 50, plr.color, "Arial", 25);
        } else {
            text(plr.username, plr.x+25, 50, plr.color, "Arial", 25);
        }
        if(plr.username == username.value) {
            if(keys[38]) plr.y-=5;
            if(keys[40]) plr.y+=5;
            playersRef.child(plr.username).set(plr);
        }
    }
}

function ballSet(prop, value) {
    ballRef.child(prop).set(value);
}

playersRef.on('child_added', snapshot => {
    players.push(snapshot.val());
});

playersRef.on('child_changed', snapshot => {
    var data = snapshot.val();
    for(var i = 0; i<players.length; i++) {
        if(players[i].username == data.username) {
            players[i] = data;
        }
    }
});

playersRef.on('child_removed', snapshot => {
    window.location.reload();
})

var objKeys = Object.keys(ball);
for(var i = 0; i<objKeys.length; i++) {
    ballRef.child(objKeys[i]).on("value", snapshot => {
        ball[snapshot.key] = snapshot.val();
    })
}

playerCountRef.on('value', snapshot => {
    playerCount = snapshot.val();
    if(playerCount>1) {
        waiting.style.display = "none";
        canvas.style.display = "block";
        setTimeout(() => {
            ballSet("vx", 3);
            ballSet("vy", 3);
        }, 2500);
        draw();
    }
});

function rect(x, y, width, height, color="black", shade=false){
    ctx.save();
    ctx.globalAlpha = 0.65;
    if(shade) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;    
    }
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
}

function disconnected() {
    playersRef.child("/" + username.value).remove();
    playerCount-=1;
    playerCountRef.set(playerCount);
}

function text(text, x, y, color="white", font="Arial", size=15) {
    ctx.fillStyle = color;
    ctx.font = `${size}px ${font}`;
    ctx.fillText(text, x, y);
}

function collide(ball, player) {
    if(ball.x<player.x+player.w && range(ball.y, player.y, player.y+h) && player.x == 0) {
        ballSet("x", player.x+player.w);
        ballSet("vx", ball.vx*-1);
    } else if(ball.x+ball.w>player.x && range(ball.y, player.y, player.y+h) && player.x>0) {
        ballSet("x", player.x-ball.w);
        ballSet("vx", ball.vx*-1);
    }
}

function range(x, i1, i2) {
    if(x>i1 && x<i2) return true;
    else return false;
}
