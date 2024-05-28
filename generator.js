//#region constants
const categories = ['prime', 'even', 'odd']
const OperationCompare = ['multiple', 'factor', 'greater than', 'less than']
const operator = ['*', '/', '+', '-', '^', 'Sqrt']
const globalCategories = ['even', 'odd', 'sum', 'greater than', 'less than', 'ascending', 'descending']
//#endregion

//#region classes
class Rule {
    constructor() {
        this.scope = 'global'
        this.type = 'rule'
        this.category = ''
        this.constant = 0
        this.digit = -1
        this.affectedDigits = []
        this.operator = ''
        this.otherDigit = 0
    }
    initialize(){}
    VerifyRule(nums) { }
    GetRuleString() { }
    GetRuleID() { }
}

class GlobalRule extends Rule {
    constructor() {
        super()
        this.type = 'globalRule'
        this.affectedDigits = [0, 1, 2, 3, 4]
        this.category = globalCategories[Math.floor(Math.random() * 7)]
        this.constant = Math.floor(Math.random() * 200) + 50
    }
    initialize(category,constant) {
        super.initialize()
        this.type = 'globalRule'
        this.affectedDigits = [0, 1, 2, 3, 4]
        this.category = category
        this.constant = constant
    }

    VerifyRule(nums) {
        let sum = nums.reduce((prev, cur) => {
            return prev + cur
        }, 0)
        if (this.category == 'odd') {
            return sum % 2 != 0
        } else if (this.category == 'even') {
            return sum % 2 == 0
        } else if (this.category == 'sum') {
            return sum == this.constant
        } else if (this.category == 'greater than') {
            return sum > this.constant
        } else if (this.category == 'less than') {
            return sum < this.constant
        } else if (this.category == 'ascending') {
            for (let i = 1; i < nums.length; i++) {
                if (nums[i] <= nums[i - 1]) {
                    return false
                }
            }
            return false
        } else if (this.category == 'descending') {
            for (let i = 1; i < nums.length; i++) {
                if (nums[i] >= nums[i - 1]) {
                    return false
                }
            }
            return false
        }
    }
    GetRuleString() {
        if (this.category == 'odd' || this.category == 'even') {
            return `The sum of the digits must be ${this.category}`
        } else if (this.category == 'sum') {
            return `The sum of the digits must be ${this.constant}`
        } else if (this.category == 'greater than' || this.category == 'less than') {
            return `The sum of the digits must be ${this.category} ${this.constant}`
        } else if (this.category == 'ascending' || this.category == 'descending') {
            return `The sum of the digits must be in ${this.category} order from left to right`
        }

    }
    GetRuleID() {
        if (this.category == 'sum') {
            return `DallC${this.category}C${this.constant}`
        } else {
            return `DallC${this.category}`
        }
    }
}

class DigitRule extends Rule {
    constructor() {
        super()
        this.type = 'digitRule'
        this.scope = 'digit'
        this.digit = Math.floor(Math.random() * 100) % 5
        this.affectedDigits = []
        this.affectedDigits.push(this.digit);
    }
    initialize(digit) {
        super.initialize()
        this.type = 'digitRule'
        this.scope = 'digit'
        this.digit = digit
        this.affectedDigits = []
        this.affectedDigits.push(this.digit);
    }
    VerifyRule(nums) { }
    GetRuleString() { }
    GetRuleID() { }
}

class Category extends DigitRule {
    constructor() {
        super()
        this.type = 'category'
        this.category = categories[Math.floor(Math.random() * 3)]
    }
    initialize(category,digit) {
        super.initialize(digit)
        this.type = 'category'
        this.category = category
    }
    GetRuleString() {
        return `Digit ${this.digit + 1} must be ${this.category}.`
    }
    VerifyRule(nums) {
        let num = nums[this.digit]
        if (this.category == 'prime') {
            for (let i = 2; i <= Math.sqrt(num); i++) {
                if (num % i == 0)
                    return false
            }
            return num >= 2
        } else if (this.category == 'even') {
            return num % 2 == 0
        } else if (this.category == 'odd') {
            return num % 2 != 0
        }
    }
    GetRuleID() {
        return `D${this.digit}C${this.category} `
    }
}

class ConstantCompare extends DigitRule {
    constructor() {
        super()
        this.type = 'constantCompare'
        this.operator = OperationCompare[Math.floor(Math.random() * 4)]
        if (this.operator == 'multiple') {
            this.constant = Math.floor(Math.random() * 9) + 2
        } else {
            this.constant = Math.floor(Math.random() * 40) + 10
        }
    }
    initialize(digit,operator,constant) {
        super.initialize(digit)
        this.type = 'constantCompare'
        this.operator = operator
        this.constant = constant
    }
    GetRuleString() {
        if (this.operator == 'multiple' || this.operator == 'factor')
            return `Digit ${this.digit + 1} is a ${this.operator} of ${this.constant}`
        else
            return `Digit ${this.digit + 1} is ${this.operator} ${this.constant}`
    }
    VerifyRule(nums) {
        let num = nums[this.digit]
        if (this.operator == 'multiple') {
            return num >= this.constant && num % this.constant == 0
        } else if (this.operator == 'factor') {
            return this.constant >= num && this.constant % num == 0
        } else if (this.operator == 'greater than') {
            return num > this.constant
        } else if (this.operator == 'less than') {
            return num < this.constant
        }
    }
    GetRuleID() {
        return `D${this.digit}O${this.operator}C${this.constant} `
    }
}

class DigitCompare extends DigitRule {
    constructor() {
        super()
        this.type = 'digitCompare'
        this.digit = Math.floor(Math.random() * 100) % 4 + 1
        this.operator = operator[Math.floor(Math.random() * 6)]
        this.otherDigit = Math.max(Math.floor(Math.random() * this.digit), 0)
        // ['*','/','+','-','^','Sqrt']
        if (this.operator == '^') {
            this.constant = Math.floor(Math.random() * 2) + 2
        } else if (this.operator == '/' || this.operator == '*') {
            this.constant = Math.floor(Math.random() * 10) + 1
        } else {
            this.constant = Math.floor(Math.random() * 30) + 1
        }
        this.affectedDigits = [this.digit, this.otherDigit]
    }
    initialize(digit,operator,otherDigit,constant) {
        super.initialize()
        this.type = 'digitCompare'
        this.digit = digit
        this.operator = operator
        this.otherDigit = otherDigit
        this.constant = constant
        this.affectedDigits = [this.digit, this.otherDigit]
    }
    GetRuleString() {
        if (this.operator == 'Sqrt') {
            return `Digit ${this.digit + 1} equals Sqrt(digit ${this.otherDigit + 1})`
        } else {
            return `Digit ${this.digit + 1} equals (digit ${this.otherDigit + 1}) ${this.operator} ${this.constant} `
        }
    }
    VerifyRule(nums) {
        let num = nums[this.digit]
        if (this.operator == '*') {
            return nums[this.otherDigit] * this.constant == num
        } else if (this.operator == '/') {
            return nums[this.otherDigit] / this.constant == num
        } else if (this.operator == '+') {
            return nums[this.otherDigit] + this.constant == num
        } else if (this.operator == '-') {
            return nums[this.otherDigit] - this.constant == num
        } else if (this.operator == '^') {
            return Math.pow(nums[this.otherDigit], this.constant) == num
        } else if (this.operator == 'Sqrt') {
            return Math.sqrt(nums[this.otherDigit]) == num
        }
    }
    GetRuleID() {
        if (this.operator == 'Sqrt') {
            return `D${this.digit}O${this.operator}OD${this.otherDigit} `
        } else {
            return `D${this.digit}O${this.operator}C${this.constant}OD${this.otherDigit} `
        }

    }
}

class GenerationResult {
    constructor(nums, rules, complexity, id) {
        this.nums = nums
        this.rules = rules
        this.complexity = complexity
        this.id = id
    }
    toString = () => {
        let string = ''
        for (let j = 0; j < this.rules.length; j++) {
            string += `${this.rules[j].GetRuleString()}\n`
        }
        string += `results: ${this.nums},Complexity: ${this.complexity}`
        return string
    }
}
//#endregion

class NumGenerator {

    //#region Methods
    constructor() { }
    getRules = (ruleCount) => {
        let rules = []
        let i = 0
        while (i < ruleCount) {
            let newRule
            let ruleNum = Math.floor(Math.random() * 3)
            if (i == ruleCount - 1) {
                newRule = new GlobalRule()
            } else if (ruleNum == 0) {
                newRule = new Category()
            } else if (ruleNum == 1) {
                newRule = new ConstantCompare()
            } else if (ruleNum == 2) {
                newRule = new DigitCompare()
            }
            let duplicate = false
            for (let j = 0; j < rules.length; j++) {
                if (rules[j].GetRuleID() == newRule.GetRuleID()) {
                    duplicate = true
                }
            }
            if (!duplicate) {
                rules.push(newRule)
                i++
            }
        }
        return rules
    }

    findValidNumbers = (ruleList, maxNum) => {
        let numList = [1, 1, 1, 1, 1]
        let ruleCount = ruleList.length
        let valid = false;
        let curNum = 0
        while (!valid && (numList[0] < maxNum || numList[1] < maxNum || numList[2] < maxNum || numList[3] < maxNum || numList[4] < maxNum)) {
            let loopValid = true
            if (curNum == numList.length) { // Global Rules check
                for (let i = 0; i < ruleCount; i++) {
                    if (ruleList[i].scope == 'global' && !ruleList[i].VerifyRule(numList)) {
                        loopValid = false
                        break
                    }
                }
                if (!loopValid) {
                    curNum--
                    numList[curNum]++
                    while (curNum >= 0 && numList[curNum] > maxNum) {
                        numList[curNum] = 1
                        curNum--
                        numList[curNum]++
                    }
                    if (curNum < 0) {
                        return [false, []]
                    }
                } else {
                    valid = true
                }
            } else { // Digit rules check
                for (let i = 0; i < ruleCount; i++) {
                    if (ruleList[i].scope == 'digit' && ruleList[i].digit == curNum && !ruleList[i].VerifyRule(numList)) {
                        loopValid = false
                        break
                    }
                }
                if (!loopValid) {
                    numList[curNum]++;
                    if (numList[curNum] > maxNum) {
                        while (curNum >= 0 && numList[curNum] > maxNum) {
                            numList[curNum] = 1
                            curNum--
                            numList[curNum]++
                        }
                        if (curNum < 0) {
                            return [false, []]
                        }
                    }
                } else {
                    curNum++
                }
            }
            // console.log(`Tried num ${numList}`)
        }
        // console.log('found number')
        // console.log(numList)
        return [true, numList]
    }

    validateNumberSolution = (ruleList, numList) => {
        for(let i = 0; i < ruleList.length; i++) {
            let validRule = ruleList[i].VerifyRule(numList)
            if(!validRule) {
                return false
            }
        }
        return true
    }

    determineComplexity = (ruleList, numList) => {
        let complexity = 0
        let digitAffects = Array(numList.length).fill(0)
        for (let i = 0; i < ruleList.length; i++) {
            complexity += ruleList[i].affectedDigits.length
            for (let j = 0; j < ruleList[i].affectedDigits.length; j++) {
                digitAffects[ruleList[i].affectedDigits[j]]++
            }

        }
        let maxAffect = digitAffects.reduce((x, y) => {
            return Math.max(x, y)
        }, 0)
        complexity += maxAffect

        let numComplexity = 0
        let nonZero = numList.filter(x => {
            return x != 1
        }).length
        let nonDuplicate = numList.filter((item,
            index) => numList.indexOf(item) === index).length
        numComplexity = nonZero + nonDuplicate
        complexity += numComplexity

        return complexity
    }

    getNumberPuzzle = (RuleCount, MaxNum, GenerationCount, ComplexityTarget) => {
        let ruleCount = !RuleCount ? 5 : RuleCount
        let maxNum = !MaxNum ? 100 : MaxNum
        let generationCount = !GenerationCount ? 100 : GenerationCount
        let complexityTarget = !ComplexityTarget ? null : ComplexityTarget

        let foundRule = false
        let curGenerationCount = 0
        let validRuleSets = 0
        let bestRules = []
        let rules = this.getRules(ruleCount)

        while (foundRule == false && curGenerationCount < generationCount) {
            let result = this.findValidNumbers(rules, maxNum)
            if (!result[0]) {
                curGenerationCount++
            } else {
                validRuleSets++
                curGenerationCount++
                bestRules.push(new GenerationResult(result[1], rules, this.determineComplexity(rules, result[1])))
            }
            console.log(`processed rule ${curGenerationCount}`)
            rules = this.getRules(ruleCount)
        }

        let orderedResults = bestRules.sort((obj1, obj2) => obj1.complexity - obj2.complexity)
        let selectedResult = null
        for (let i = 0; i < orderedResults.length; i++) {
            selectedResult = orderedResults[i]
            if (selectedResult.complexity >= complexityTarget) {
                break;
            }
        }
        // for (let i = 0; i < orderedResults.length; i++) {
        //     for (let j = 0; j < orderedResults[i].rules.length; j++) {
        //         console.log(orderedResults[i].rules[j].GetRuleString())
        //     }
        //     console.log(`number:${orderedResults[i].nums},complexity:${orderedResults[i].complexity}`)
        // }
        return selectedResult
    }

    createSQLPuzzleInsertStatement = (generationResult) => {
        return `INSERT INTO number_puzzle(nums,complexity) VALUES('${generationResult.nums.toString()}',${generationResult.complexity}) returning id`
    }

    createSQLRuleInsertStatement = (rule, puzzleId) => {
        return `INSERT INTO number_puzzle_rule(number_puzzle_id,type,scope,category,constant,digit,affected_digits,operator,other_digit) Values(${puzzleId},'${rule.type}','${rule.scope}','${rule.category}',${rule.constant},${rule.digit},'${rule.affectedDigits}','${rule.operator}',${rule.otherDigit})`
    }



    convertObjectToNumber = (obj) => {
        let nums = (typeof obj.nums == "string") ? obj.nums.split(',').map(Number) : obj.nums
        let newObject = new GenerationResult(nums,[],obj.complexity,obj.id)
        return newObject
    }

    convertObjectToRule = (obj) => {
        let newObject
        if (obj.type == '') {
            newObject = new Rule()
            newObject.initialize()
        } else if (obj.type == 'globalRule') {
            newObject = new GlobalRule()
            newObject.initialize(obj.category,obj.constant)
        } else if (obj.type == 'digitRule') {
            newObject = new DigitRule()
            newObject.initialize(obj.digit)
        } else if (obj.type == 'category') {
            newObject = new Category()
            newObject.initialize(obj.category,obj.digit)
        } else if (obj.type == 'constantCompare') {
            newObject = new ConstantCompare()
            newObject.initialize(obj.digit,obj.operator,obj.constant)
        } else if (obj.type == 'digitCompare') {
            newObject = new DigitCompare()
            newObject.initialize(obj.digit,obj.operator,!obj.other_digit ? obj.otherDigit : obj.other_digit,obj.constant)
        }
        return newObject
    }
    //#endregion
}

// let result = getNumberPuzzle(10,100,100,100)
// for(let j = 0; j < result.rules.length; j++) {
//     console.log(result.rules[j].GetRuleString())
// }
// console.log(`results: ${result.nums},Complexity: ${result.complexity}`)


module.exports = {
    Rule,
    GlobalRule,
    DigitRule,
    ConstantCompare,
    DigitCompare,
    Category,
    GenerationResult,
    NumGenerator
};