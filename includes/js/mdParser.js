// a real simple MD parser
// I'm only doing this to practice regEx :)

// See ./mdParse.md for futher details.

print = console.log;

class MarkDownParse{

    static ReplaceMode = {
        "NORMAL": 0,        // does a strete replace
        "EXTRACT": 1        // extracts the values, to ensure that it does not get parsed a second time. ie
                            // a link url may contatin /a_b_c.png   this would pasre b as italic
    }

    constructor( overrideOutputs={} ){

        // define default html elements.
        // this alows use to replace any that are supplied by params
        // while ensuring that all required are still present.
        var outputs = { 
            header: {
                "#": "<h1>{v0}</h1><hr/>",
                "##": "<h2>{v0}</h2><hr/>",
                "###": "<h3>{v0}</h3>",
                "####": "<h4>{v0}</h4>",
                "#####": "<h5>{v0}</h5>",
                "######": "<h6>{v0}</h6>"
            },
            hozRule: {
                "===": "<hr />",
            },
            boldItalic: {
                "*": "<i>{v0}</i> ",
                "_": "<i>{v0}</i> ",
                "**": "<b>{v0}</b> ",
                "__": "<b>{v0}</b> ",
                "~~": "<strike>{v0}</strike> "
            },
            linksImages: {
                "undefined": "<a href='{v1}'>{v0}</a>",
                "!": "<img src='{v1}' alt='{v0}' style='max-width: 100%' />"
            },
            newLine:{
                "  \n": "<br />",
                "\n\n": "<br />",
            }

        };

        // update the output.
        var overrideOutputKeys = Object.keys( overrideOutputs ) 

        for ( var ok = 0; ok < overrideOutputKeys.length; ++ok )
        {
            var outputKey = overrideOutputKeys[ok];
            var overrideElementKeys = Object.keys[outputKey];

            for ( var ek = 0; ek < overrideElementKeys.length; ++ek )
            {
                var elementKey = overrideElementKeys[ek];
                outputs[outputKey][elementKey] = overrideOutputs[outputKey][elementKey];
            }

        }

        this.afterRegex = {
            header: {
                regex: /(^##{0,5}) (.+)/m,            
                keyCapGroups: [1],      //this list id must match the values list id
                valueCapGroups: [[2]],
                output: outputs.header
                
            },
            hozRule: {
                regex: /(={3})=*/,              
                keyCapGroups: [1],      //this list id must match the values list id
                valueCapGroups: [[]],
                output: outputs.hozRule
            },
            newLine:{
                regex: /( {2}\n)|(\n{2})/,
                keyCapGroups: [0, 1],      
                valueCapGroups: [[], []],
                output: outputs.newLine
            },
            boldItalic: {
                regex: /((\*{1,2}|\~{2}|\_{1,2})([\!-\~ \t]+?)\2) /,        //TODO: remove the end space, this is a tep fix for links and images
                keyCapGroups: [2],      
                valueCapGroups: [[3]],
                output: outputs.boldItalic
            },
            linksImages: {
                regex: /(!)*\[([ -Z\\^-~]*)\]\(([ -'*-~]*)\)/,
                keyCapGroups: [1],      
                valueCapGroups: [[2, 3]],
                output: outputs.linksImages
            }
        };

    }

    parse(string){

        // remove all carage returns, so the string is consistent between platforms
        string = string.replace(/\r/g, "");
        console.log("-------------------->", /\n/.test(string))
        var output = string;
        
        // parse all of the affter regex
        var values = Object.values(this.afterRegex);
        
        for ( var i = 0; i < values.length; ++i)
        {
            var temp = this._parse( values[i], output, true )

            if ( temp != null ) // if nothing was parsed insert the original string.
                output = temp;
        }

        return output;

    }

    _parse(regexParseObj, string, update=false)
    {
        /**
         * @returns: null if no match, otherwise parsed string
         */

        // we must add the newline back to the end of string
        // so we can detect line breaks '/(  )\n/'
        var output = string ; 
        var parsed = false;

        // parse the string at least once.
        // when not in update, the string is only parsed once (line by line mode),
        // otherwise parse untill theres no regex matches remaining.
        do{

            var regGroups = regexParseObj.regex.exec(output);
            //console.log(regGroups);
            console.log(regexParseObj.regex);
            console.log(output);
            if ( regGroups != null )
            {

                print(regGroups);
                var foundReplacement = false;
                var noMatchString = "";

                for ( var j = 0; j < regexParseObj.keyCapGroups.length; j++ )
                {
                    // find if any of the 'capture group output keys' are in the output object
                    if ( regGroups[ regexParseObj.keyCapGroups[j] ] in regexParseObj.output )
                    {
                        var tempOutput = regexParseObj.output[ regGroups[ regexParseObj.keyCapGroups[j] ] ];

                        // parsh all of the capture group output values' into 
                        // the output @ 'capture group output keys' html element.
                        for( var k = 0; k < regexParseObj.valueCapGroups[j].length; k++)
                        {
                            tempOutput =  tempOutput.replace(`{v${k}}`, regGroups[ regexParseObj.valueCapGroups[j][k] ]);  
                        }
                        
                        if ( update )
                            output = output.replace(regGroups[0], tempOutput);  // replace the (whole) match with the output value.
                        else
                            output = tempOutput;
                        

                        parsed = true;
                        foundReplacement = true
                    }
                    else
                    {
                        noMatchString += `[${regGroups[ regexParseObj.keyCapGroups[j] ]}], `
                    }

                }

                if ( !foundReplacement )
                {
                    console.error("Failed To Parse, A match without a replacement has occurred. This caused infinity loops.");
                    console.error(`Make sure the following keys are set in the output strings for regex '${regexParseObj.regex}' `);
                    console.error(noMatchString.replace(/\n/g, "\\n"));
                    return;
                }

            }

        }while(update && regGroups != null);

        return parsed ? output : null;    

    }

}
