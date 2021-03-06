// Bot usage: "require(filename)(msg);"
const CSV=require("./csv.js");
let reacts=false;
/*
    Future plans:
        Message in #words-words-words when request/report is filled/fixed tagging original author plus any who have :point_up:ed that message.
        Possibly make types object be able to handle the idiosyncrasies of different formats and scrap the switch/case block.
*/
// Configuration constants
const err=true; // error mode, else request mode
const filepath="./data/"; // where to put data files (relative to BOT file) (Always include trailing "/" or it will be a filename prefix)
const ext="txt"; // Extension to use for data files

// types supported, possible future expansion will allow for distinctions here so as to remove the switch statement completely
//format "emoji":["file","text"]
const types={"📺":["tv","TV show"],"🎞️":["movie","movie"],"🎵":["music","song"],"📖":["audiobook","audiobook"],"📖":["book","book"],"🎲":["rpg","role-playing game"],"💥":["comic","comic book"]};
var log={};
Object.values(types).forEach(key=>log[key[0]]=CSV.readArraySync(`${filepath}${key[0]}.${ext}`));
watchReacts=function(m,f,l,k,cc) {
    const filter=(reaction,user)=>{
        let r=m.guild.members.cache.get(user.id).roles.cache;
        return !!(reaction.emoji.name==='✨'&&(r.has("581334517151825920")||r.has("581538686265589772")))
    };
    m.createReactionCollector(filter,{max:1}).on('collect', (r,c) => {
        //m=r.message;
        t=[];
        log[f].forEach((v,i)=>{if (i!==k) t.push(v)});
        log[f]=t;
        let notifies={};
        notifies[m.author.id]=1
        if (r.message.reactions.cache.has("☝️")) r.message.reactions.cache.get("☝️").users.cache.keyArray().forEach(u=>notifies[u]=1);
        let pings=`<@${Object.keys(notifies).join("> <@")}> `;
        cc.send(`${pings}, ${f} ${l[2]} (${(f=="music"?l[4]:l[3])}) is ${(err?"fixed":"up")}.`);
        CSV.writeArraySync(`${filepath}${f}.${ext}`,log[f]);
    })
}
module.exports=function(message) {
    /*
        1=Error toggle (icon/undefined)
        2=Type
        3=Title, etc
        4=Year, etc
        5=Season for TV Error
        6=Channel for TV/Episode for TV Error
        8=Notes
        
        if (info && info.length>2&&info[1])
        console.log(type[info[2]]+" - "+info[3]+" ("+info[4]+") "+info[8]);

        */
	const Jenny=message.client;
	if (Jenny.trainRep) {repconn = Jenny.chanMan.get(Jenny,"test");}
	else {(repconn = Jenny.chanMan.get(Jenny, "report"));}
	sChat=Jenny.chanMan.get(Jenny,"help");


    if (Jenny.training) {
		rChat="681380531493142533";
	}
	else {
		rChat="581340136374009856";
	}
	const chatchan=message.client.guilds.cache.get("581333387403329557").channels.cache.get(rChat);
    const chan=message.client.guilds.cache.get("581333387403329557").channels.cache.get((err?"581603029263056921":"581339870790680586"));
    const mode=err?"problem report":"request";
    let deleteMsg=true,type=undefined,dmText=`Oops! This channel is for media ${mode}s. Conversations go in ${chatchan}.`;
    if (!reacts) {
        reacts=true;
        Object.keys(log).forEach(f=>log[f].forEach((l,k)=>chan.messages.fetch(l[1]).then(m=>watchReacts(m,f,l,k,chatchan)).catch(console.error)));
    }
    if (message.channel==chan) {
        info=message.content.match(err?/^(🛑)?\s*(\S+)\s+\*\*(.*)\*\*\s+\((.*)\)\s*-?\s*S?(\d{2})?E?(\d{2})?(\s+\*(.*)\*)?$/:/^(🛑)?\s*(\S+)\s+\*\*(.*)\*\*\s+\((.*)\)(\s+on\s+(.+))?(\s+\*(.*)\*)?$/);
        if (info && info.length==9&&info[2]&&!err==!info[1]) {
            var year=info[4].match(/^\S{4}$/);
            switch(info[2]) {
                case "📺":
                    //:tv:   **TITLE** (DATE, STATUS [Upcoming, Ongoing, Ended]) on CHANNEL *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    status=["Unknown","Upcoming","Ongoing","Ended"];
                    date=info[4].match(/^(.+), *(.*)$/);
                    if (err&&!year) dmText="Oops! what's the release year?";
                    else if (err&&!info[5]) dmText=`Oops! I need to know the ${type[1]} season number. (2 digits)`;
                    else if (err&&!info[6]) dmText=`Oops! I need to know the ${type[1]} episode number. (2 digits)`;
                    else if (err&&!info[8]) dmText=`Oops! You need to tell me what's wrong with this ${type[1]}.`;
                    else {
                        deleteMsg=false;
                        dmText=`Thanks for your ${mode} about the ${(err?"":"\`${date[2].toLowerCase()}\` ")}${type[1]} \`${info[3]}\` from ${(err?"episode ":"")}\`${info[6]}\` ${(err?"of season "+info[5]+" ":"")}released in \`${(err?info[4]:date[1])}\`.${(info[8]?" The following report was included: \`"+info[8]+"\`.":"")}`;
                        log[type[0]].push([message.author.id,message.id,info[3],info[4],info[5],info[6],info[8]]);
                    }
                    break;
                case "🎞️":
                    //:film_frames:  **TITLE** (DATE, STATUS [Upcoming, TV Special, In Theater, DVD Release]) *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    status=["Unknown","Upcoming","TV Special","In Theater","DVD Release"];
                    date=info[4].match(/^(.+), *(.*)$/);
                    if (err&&!year) dmText="Oops! what's the release year?";
                    else if (err&&!info[8]) dmText=`Oops! You need to tell me what's wrong with this ${type[1]}.`;
					else if (err&&(info[5]||info[6])) dmText="Oops! Seasons, and Episodes are only for TV shows.";
                    else {
                        deleteMsg=false;
                        dmText=`Thanks for your ${mode} about the ${(err?"":"\`${date[2].toLowerCase()}\` ")}${type[1]} \`${info[3]}\` released in \`${(err?info[4]:date[1])}\`.${(info[8]?" The following report was included: \`"+info[8]+"\`.":"")}`;
                        log[type[0]].push([message.author.id,message.id,info[3],info[4],info[8]]);
                    }
                    break;
                case "🎵":
                    //:musical_note:   **ARTIST - TITLE** (YEAR) *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    tags=info[3].split(" - ");
                    n=["artist","title"];
                    if (tags.length!=n.length) {
                        dmText=`Oops! ${(tags.length>n.length?"You cannot use space-hypen-space (\` - \`) in "+n.slice(0,-1).join(", ")+" or "+n[n.length-1]+".":"I need "+n.slice(0,-1).join(", ")+" and "+n[n.length-1]+" separated by space-hyphen-space (\` - \`) for me to take your "+mode+".")}`;
                    }
                    else if (err&&!year) dmText="Oops! what's the release year?";
					else if (!info[8]&&err) dmText=`Oops! You need to tell me what's wrong with this ${type[1]}.`;
                    else if (err&&(info[5]||info[6])) dmText="Oops! Seasons, and Episodes are only for TV shows.";
					else {
                        deleteMsg=false;
                        dmText=`Thanks for your ${mode} about the ${type[1]} \`${tags[1]}\` performed by \`${tags[0]}\` in \`${info[4]}\`.${(info[8]?" The following report was included: \'"+info[8]+"\'.":"")}`;
                        log[type[0]].push([message.author.id,message.id,tags[0],tags[1],tags[2],info[4],(info[8]?info[8]:"")]);
                    }
                    break;
                case "📖":
                    //:book:   **AUTHOR - SERIES - TITLE** (YEAR) *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    tags=info[3].split(" - ");
                    n=["author","series","title"];
                    if (tags.length!=n.length) {
                        dmText=`Oops! ${(tags.length>n.length?"You cannot use space-hypen-space (\` - \`) in "+n.slice(0,-1).join(", ")+" or "+n[n.length-1]+".":"I need "+n.slice(0,-1).join(", ")+" and "+n[n.length-1]+" separated by space-hyphen-space (\` - \`) for me to take your "+mode+".")}`;
                    }                
                    else if (err&&!year) dmText="Oops! what's the release year?";
					else if (!info[8]&&err) dmText=`Oops! You need to tell me what's wrong with this ${type[1]}.`;
                    else if (err&&(info[5]||info[6])) dmText="Oops! Seasons, and Episodes are only for TV shows.";
					else {
                        deleteMsg=false;
                        dmText=`Thanks for your ${mode} about the ${type[1]} \`${tags[2]}\` written by \`${tags[0]}\` in \`${info[4]}\` in the \`${tags[1]}\` series.${(info[8]?" The following report was included: \'"+info[8]+"\'.":"")}`;
                        log[type[0]].push([message.author.id,message.id,tags[0],tags[1],tags[2],tags[3],info[4],(info[8]?info[8]:"")]);
                    }
                    break;
                case "📚":
                    //:books:   **AUTHOR - SERIES - TITLE** (YEAR) *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    tags=info[3].split(" - ");
                    n=["author","series","title"];
                    if (tags.length!=n.length) {
                        dmText=`Oops! ${(tags.length>n.length?"You cannot use space-hypen-space (\` - \`) in "+n.slice(0,-1).join(", ")+" or "+n[n.length-1]+".":"I need "+n.slice(0,-1).join(", ")+" and "+n[n.length-1]+" separated by space-hyphen-space (\` - \`) for me to take your "+mode+".")}`;
                    }                
                    else if (err&&!year) dmText="Oops! what's the release year?";
					else if (!info[8]&&err) dmText=`Oops! You need to tell me what's wrong with this ${type[1]}.`;
                    else if (err&&(info[5]||info[6])) dmText="Oops! Seasons, and Episodes are only for TV shows.";
					else {
                        deleteMsg=false;
                        dmText=`Thanks for your ${mode} about the ${type[1]} \`${tags[2]}\` written by \`${tags[0]}\` in \`${info[4]}\` in the \`${tags[1]}\` series.${(info[8]?" The following report was included: \'"+info[8]+"\'.":"")}`;
                        log[type[0]].push([message.author.id,message.id,tags[0],tags[1],tags[2],tags[3],info[4],(info[8]?info[8]:"")]);
                    }
                    break;
                case "🎲":
                    //:game_die:   **PUBLISHER - SERIES - TITLE** (YEAR) *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    tags=info[3].split(" - ");
                    n=["publisher","series","title"];
                    if (tags.length!=n.length) {
                        dmText=`Oops! ${(tags.length>n.length?"You cannot use space-hypen-space (\` - \`) in "+n.slice(0,-1).join(", ")+" or "+n[n.length-1]+".":"I need "+n.slice(0,-1).join(", ")+" and "+n[n.length-1]+" separated by space-hyphen-space (\` - \`) for me to take your "+mode+".")}`;
                    }                
                    else if (err&&!year) dmText="Oops! what's the release year?";
					else if (!info[8]&&err) dmText=`Oops! You need to tell me what's wrong with this ${type[1]}.`;
                    else if (err&&(info[5]||info[6])) dmText="Oops! Seasons, and Episodes are only for TV shows.";
					else {
                        deleteMsg=false;
                        dmText=`Thanks for your ${mode} about the ${type[1]} \`${tags[2]}\` published by \`${tags[0]}\` in \`${info[4]}\` in the \`${tags[1]}\` series.${(!info[8]?"":" The following report was included: \'"+info[8]+"\'.")}`;
                        log[type[0]].push([message.author.id,message.id,tags[0],tags[1],tags[2],tags[3],info[4],(info[8]?info[8]:"")]);
                    }
                    break;
                case "💥":
                    //:boom:   **PUBLISHER - SERIES - TITLE** (YEAR) *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    tags=info[3].split(" - ");
                    n=["publisher","series","title"];
                    if (tags.length!=n.length) {
                        dmText=`Oops! ${(tags.length>n.length?"You cannot use space-hypen-space (\` - \`) in "+n.slice(0,-1).join(", ")+" or "+n[n.length-1]+".":"I need "+n.slice(0,-1).join(", ")+" and "+n[n.length-1]+" separated by space-hyphen-space (\` - \`) for me to take your "+mode+".")}`;
                    }                
                    else if (err&&!year) dmText="Oops! what's the release year?";
					else if (!info[8]&&err) dmText=`Oops! You need to tell me what's wrong with this ${type[1]}.`;
                    else if (err&&(info[5]||info[6])) dmText="Oops! Seasons, and Episodes are only for TV shows.";
					else {
                        deleteMsg=false;
                        dmText=`Thanks for your ${mode} about the ${type[1]} \`${tags[2]}\` published by \`${tags[0]}\` in \`${info[4]}\` in the \`${tags[1]}\` series.${(!info[8]?"":" The following report was included: \'"+info[8]+"\'.")}`;
                        log[type[0]].push([message.author.id,message.id,tags[0],tags[1],tags[2],tags[3],info[4],(info[8]?info[8]:"")]);
                    }
                    break;
                default:
                    dmText=`Oops! That's not the right emoji for this ${mode}! Try another one.`
            }
        }
		if (Jenny.training) {
			message.author.send("Sorry, but I can't help you while I'm training with the boss. Try again in a little bit.").catch(error => {
				Jenny.error("There was a problem with sending a DM. [A2]\n", error);
				sChat.send(`${Jenny.errs} [A2]`);
			});
			deleteMsg=true;
		}
		else if (dmText) message.author.send(dmText).catch(error => {
			Jenny.error("There was a problem with sending a DM. [A2]\n", error);
			sChat.send(`${Jenny.errs} [A2]`);
		});
        if (deleteMsg) {
            message.author.send(`I deleted your message. Here it is for reference:\n\`\`\`${message.content}\`\`\``);
            message.delete({timeout:0,reason:"Non-conformant"}).catch(error => {
			Jenny.error("There was a problem deleting a message. [A3]\n", error);
			sChat.send(`${Jenny.errs} [A3]`);
			});
        }
        else {
            CSV.writeArraySync(`${filepath}${type[0]}.${ext}`,log[type[0]]);
            watchReacts(message,type[0],log[type[0]][(log[type[0]].length-1)],(log[type[0]].length-1),chatchan);
        }
    }
}
