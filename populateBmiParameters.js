var fs = require('fs');
var JSONStream = require("JSONStream");
var eventStream = require("event-stream");

//Importing BMI range vs category mapping with ceil values 
const bmiRangeCategoryMap = require("./bmiRangeCategoryMap.json")

//Configuring person data file path and read stream options
const personDataFilePath = './personData.json';
const readStreamOptions = { encoding: "utf-8" };

//Configuring output file path and creating a write stream
const personDataOutFilePath = './updatedPersonData.json';
var outFile = fs.createWriteStream(personDataOutFilePath);

populateBmiCategory = (person) => {
        //Calculating person's BMI value.
        const personBmiValue = person.WeightKg / (person.HeightCm * 0.01);
        // Rounding off to 1 decimal places to comply with the range values given and for better readability
        person["BMI"] = parseFloat(personBmiValue.toFixed(1));

        //Initiating person's bmi category and risk levels with the hihest levels possible.
        let personsBmiCategory = "verySeverelyObese";
        let personsRiskLevel = "veryHigh"

        //Determining the person's correct bmi category and risk level using range category mapping data.
        const bmiRangeCategoryMapCeilValues = Object.keys(bmiRangeCategoryMap);
        bmiRangeCategoryMapCeilValues.forEach((ceilValue) => {
            if (ceilValue > personBmiValue){
                personsBmiCategory = bmiRangeCategoryMap[ceilValue].category;
                personsRiskLevel = bmiRangeCategoryMap[ceilValue].riskLevel;
                return false;
            }
        });
        
        //Storing data into intial persons table
        person["bmiCategory"] = personsBmiCategory;
        person["healthRisk"] = personsRiskLevel;

        return person;
}

processEachChunk = (person) => {
    person = populateBmiCategory(person);
    outFile.write(JSON.stringify(person));
    outFile.write(',');
}

onReadStreamEnd = () => {
    outFile.write(']');
    outFile.close();
}

processJsonFileData = () => {
    personDataInStream = fs.createReadStream(personDataFilePath,readStreamOptions);
    outFile.write('[');
    personDataInStream
        .pipe(JSONStream.parse("*"))
        .pipe(eventStream.through(processEachChunk))
        .on('end', onReadStreamEnd);
}

processJsonFileData();