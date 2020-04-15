// Bot usage: "require(filename)(msg);"
const CSV=require("./csv.js");

/*
    Future plans:
        Message in #words-words-words when request/report is filled/fixed tagging original author plus any who have :point_up:ed that message.
        Possibly make types object be able to handle the idiosyncrasies of different formats and scrap the switch/case block.
*/

// Configuration constants
const err=true; // error mode, else request mode
const filepath="../data/"; // where to put data files (relative to THIS file) (Always include trailing "/" or it will be a filename prefix)
const ext="txt"; // Extension to use for data files

// types supported, possible future expansion will allow for distinctions here so as to remove the switch statement completely
//format "emoji":["file","text"]
const types={"📺":["tv","TV show"],"🎞️":["movie","movie"],"🎵":["music","song"],"📖":["audiobook","audiobook"],"📖":["book","book"],"🎲":["rpg","role-playing game"],"💥":["comic","comic book"]};
var log={};
Object.keys(types).forEach(key => {log[types[key][0]]=CSV.readArraySync(filepath+"/"+types[key][0]+"."+ext)});

module.exports=function(message) {
    /*
        1=Error toggle
        2=Type
        3=Title, etc
        4=Year, etc
        5=Season for TV Error
        6=Channel for TV/Episode for TV Error
        8=Notes
        
        if (info && info.length>2&&info[1])
        console.log(type[info[2]]+" - "+info[3]+" ("+info[4]+") "+info[8]);

    */
    const chatchan=message.client.guilds.get("581333387403329557").channels.get("581340136374009856");
    const chan=message.client.guilds.get("581333387403329557").channels.get((err?"581603029263056921":"581339870790680586"));
    const mode=err?"problem report":"request";
    let deleteMsg=true,type=undefined,dmText="Oops! This channel is for media problem "+mode+"s. Conversations go in "+chatchan+".";
    if (message.channel===chan) {
        let info=message.content.match(err?/^(🛑)?\s*(\S+)\s+\*\*(.*)\*\*\s+\((.*)\)\s*-?\s*S?(\d{2})?E?(\d{2})?(\s+\*(.*)\*)?$/:/^(🛑)?\s*(\S+)\s+\*\*(.*)\*\*\s+\((.*)\)(\s+on\s+(.+))?(\s+\*(.*)\*)?$/);
        if (info && info.length==9&&info[2]&&!err==!info[1]) {
            switch(info[2]) {
                case "📺":
                    //:tv:   **TITLE** (DATE, STATUS [Upcoming, Ongoing, Ended]) on CHANNEL *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    status=["Unknown","Upcoming","Ongoing","Ended"];
					if(!err) { //This if is for Carl only
						date=info[4].match(/^(\S{4}), (.*)$/);
						if (!date) dmText="I'm sorry, I didn't understand your date and/or status.";
						else if (!status.includes(date[2])) dmText="I'm sorry, that is not a valid status.\n\nValid statuses are: "+status.slice(1).join(", ")+".";
					}
                    else if (!info[4].match(/^\S{4}$/)) dmText="Oops! what's the release year?";
					else if (err) {
						if (!info[5]) dmText="Oops! I need to know the "+type[1]+" season number. (2 digits)";
						else if (!info[6]) dmText="Oops! I need to know the "+type[1]+" episode number. (2 digits)";
						else if (!info[8]) dmText="Oops! You need to tell me what's wrong with this "+type[1]+".";
					}
                    else if (!info[6]) dmText="I'm sorry, what channel is that "+type[1]+" on again?"; //Carl only
                    else {
                        deleteMsg=false;
                        dmText="Thanks for your "+mode+" about the "+(err?"":"`"+date[2].toLowerCase()+"` ")+type[1]+" `"+info[3]+"` from "+(err?"episode ":"")+"`"+info[6]+"` "+(err?"of season `"+info[5]+"` ":"")+"released in `"+(err?info[4]:date[1])+"`."+(!info[8]?"":" The following report was included: `"+info[8]+"`.");
                        if (err) log[type[0]].push(message.author.id,message.id,info[3],info[4],info[5],info[6],info[8]);
                        else log[type[0]].push(message.author.id,message.id,info[3],date[1],date[2],info[6],(info[8]?info[8]:"")); //this line is Carl only
                    }
                    break;
                case "🎞️":
                    //:film_frames:  **TITLE** (DATE, STATUS [Upcoming, TV Special, In Theater, DVD Release]) *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    status=["Unknown","Upcoming","TV Special","In Theater","DVD Release"];
					if (!err) { //Carl only
						date=info[4].match(/^(\S{4}), (.*)$/);
						if (!date) dmText="I'm sorry, I didn't understand your date and/or status.";
						else if (!status.includes(date[2])) dmText="I'm sorry, that is not a valid status.\n\nValid statuses are: "+status.slice(1).join(", ")+".";
						else if (!date[1].match(/^\S{4}$/)) dmText="Oops! what's the release year?";
					}
                    else if (!info[4].match(/^\S{4}$/)) dmText="Oops! what's the release year?";
					else if (!info[8]) dmText="Oops! You need to tell me what's wrong with this "+type[1]+".";
                    else {
                        deleteMsg=false;
                        dmText="Thanks for your "+mode+" about the "+(err?"":"`"+date[2].toLowerCase()+"` ")+type[1]+" `"+info[3]+"` released in `"+(err?info[4]:date[1])+"`."+(!info[8]?"":" The following report was included: `"+info[8]+"`.");
                        if (err) log[type[0]].push(message.author.id,message.id,info[3],info[4],info[8]);
                        else log[type[0]].push(message.author.id,message.id,info[3],date[1],date[2],(info[8]?info[8]:""));
                    }
                    break;
                case "🎵":
                    //:musical_note:   **ARTIST - TITLE** (YEAR) *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    tags=info[3].split(" - ");
                    n=["artist","title"];
                    if (tags.length!=n.length) {
                        dmText="Oops! "+(tags.length>n.length?"You can't use space-hypen-space (` - `) in "+n.slice(0,-1).join(", ")+" or "+n[n.length-1]+".":"I need "+n.slice(0,-1).join(", ")+" and "+n[n.length-1]+" separated by space-hyphen-space (` - `) for me to take your "+mode+".");
                    }
                    else if (!info[4].match(/^\S{4}$/)) dmText="Oops! what's the release year?";
					else if (!info[8]&&err) dmText="Oops! You need to tell me what's wrong with this "+type[1]+".";
                    else {
                        deleteMsg=false;
                        dmText="Thanks for your "+mode+" about the "+type[1]+" `"+tags[1]+"` performed by `"+tags[0]+"` in `"+info[4]+"`."+(!info[8]?"":" The following report was included: `"+info[8]+"`.");
                        log[type[0]].push(message.author.id,message.id,tags[1],tags[2],info[4],(info[8]?info[8]:""));
                    }
                    break;
                case "📖":
                    //:book:   **AUTHOR - SERIES - TITLE** (YEAR) *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    tags=info[3].split(" - ");
                    n=["author","series","title"];
                    if (tags.length!=n.length) {
                        dmText="Oops! "+(tags.length>n.length?"You can't use space-hypen-space (` - `) in "+n.slice(0,-1).join(", ")+" or "+n[n.length-1]+".":"I need "+n.slice(0,-1).join(", ")+" and "+n[n.length-1]+" separated by space-hyphen-space (` - `) for me to take your "+mode+".");
                    }                
                    else if (!info[4].match(/^\S{4}$/)) dmText="Oops! what's the release year?";
					else if (!info[8]&&err) dmText="Oops! You need to tell me what's wrong with this "+type[1]+".";
                    else {
                        deleteMsg=false;
                        dmText="Thanks for your "+mode+" about the "+type[1]+" `"+tags[2]+"` written by `"+tags[0]+"` in `"+info[4]+"` in the `"+tags[1]+"` series."+(!info[8]?"":" The following report was included: `"+info[8]+"`.");
                        log[type[0]].push(message.author.id,message.id,tags[1],tags[2],tags[3],info[4],(info[8]?info[8]:""));
                    }
                    break;
                case "📚":
                    //:books:   **AUTHOR - SERIES - TITLE** (YEAR) *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    tags=info[3].split(" - ");
                    n=["author","series","title"];
                    if (tags.length!=n.length) {
                        dmText="Oops! "+(tags.length>n.length?"You can't use space-hypen-space (` - `) in "+n.slice(0,-1).join(", ")+" or "+n[n.length-1]+".":"I need "+n.slice(0,-1).join(", ")+" and "+n[n.length-1]+" separated by space-hyphen-space (` - `) for me to take your "+mode+".");
                    }                
                    else if (!info[4].match(/^\S{4}$/)) dmText="Oops! what's the release year?";
					else if (!info[8]&&err) dmText="Oops! You need to tell me what's wrong with this "+type[1]+".";
                    else {
                        deleteMsg=false;
                        dmText="Thanks for your "+mode+" about the "+type[1]+" `"+tags[2]+"` written by `"+tags[0]+"` in `"+info[4]+"` in the `"+tags[1]+"` series."+(!info[8]?"":" The following report was included: `"+info[8]+"`.");
                        log[type[0]].push(message.author.id,message.id,tags[1],tags[2],tags[3],info[4],(info[8]?info[8]:""));
                    }
                    break;
                case "🎲":
                    //:game_die:   **PUBLISHER - SERIES - TITLE** (YEAR) *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    tags=info[3].split(" - ");
                    n=["publisher","series","title"];
                    if (tags.length!=n.length) {
                        dmText="Oops! "+(tags.length>n.length?"You can't use space-hypen-space (` - `) in "+n.slice(0,-1).join(", ")+" or "+n[n.length-1]+".":"I need "+n.slice(0,-1).join(", ")+" and "+n[n.length-1]+" separated by space-hyphen-space (` - `) for me to take your "+mode+".");
                    }                
                    else if (!info[4].match(/^\S{4}$/)) dmText="Oops! what's the release year?";
					else if (!info[8]&&err) dmText="Oops! You need to tell me what's wrong with this "+type[1]+".";
                    else {
                        deleteMsg=false;
                        dmText="Thanks for your "+mode+" about the "+type[1]+" `"+tags[2]+"` published by `"+tags[0]+"` in `"+info[4]+"` in the `"+tags[1]+"` series."+(!info[8]?"":" The following report was included: `"+info[8]+"`.");
                        log[type[0]].push(message.author.id,message.id,tags[1],tags[2],tags[3],info[4],(info[8]?info[8]:""));
                    }
                    break;
                case "💥":
                    //:boom:   **PUBLISHER - SERIES - TITLE** (YEAR) *OPTIONAL NOTES TO HELP DIFFERENTIATE*
                    type=types[info[2]];
                    tags=info[3].split(" - ");
                    n=["publisher","series","title"];
                    if (tags.length!=n.length) {
                        dmText="Oops! "+(tags.length>n.length?"You can't use space-hypen-space (` - `) in "+n.slice(0,-1).join(", ")+" or "+n[n.length-1]+".":"I need "+n.slice(0,-1).join(", ")+" and "+n[n.length-1]+" separated by space-hyphen-space (` - `) for me to take your "+mode+".");
                    }                
                    else if (!info[4].match(/^\S{4}$/)) dmText="Oops! what's the release year?";
					else if (!info[8]&&err) dmText="Oops! You need to tell me what's wrong with this "+type[1]+".";
                    else {
                        deleteMsg=false;
                        dmText="Thanks for your "+mode+" about the "+type[1]+" `"+tags[2]+"` published by `"+tags[0]+"` in `"+info[4]+"` in the `"+tags[1]+"` series."+(!info[8]?"":" The following report was included: `"+info[8]+"`.");
                        log[type[0]].push(message.author.id,message.id,tags[1],tags[2],tags[3],info[4],(info[8]?info[8]:""));
                    }
                    break;
                default:
                    dmText="Oops! That's not the right emoji for this "+mode+"! Try another one."
            }
        }
        if (dmText) message.author.send(dmText).catch();
        if (deleteMsg) {
            message.author.send("I deleted your message. Here it is for reference:\n```"+message.content+"```");
            message.delete(1).catch();
        }
        else Object.keys(log).forEach(key => {CSV.writeArraySync(filepath+key+"."+ext,log[key])});
    }
}