import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import multer from 'multer';
import path from 'path';
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import env from "dotenv";


const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

const sessionSecret = process.env.SESSION_SECRET;
const pgUser = process.env.PG_USER;
const pgHost = process.env.PG_HOST;
const pgDatabase = process.env.PG_DATABASE;
const pgPort = process.env.PG_PORT;

const countries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. Swaziland)", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea (North)", "Korea (South)", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia (formerly Macedonia)", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City (Holy See)", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

const currencies = [
  "AFN (Afghan Afghani)",
  "ALL (Albanian Lek)",
  "DZD (Algerian Dinar)",
  "EUR (Euro)",
  "AOA (Angolan Kwanza)",
  "XCD (East Caribbean Dollar)",
  "ARS (Argentine Peso)",
  "AMD (Armenian Dram)",
  "AUD (Australian Dollar)",
  "AZN (Azerbaijani Manat)",
  "BSD (Bahamian Dollar)",
  "BHD (Bahraini Dinar)",
  "BDT (Bangladeshi Taka)",
  "BBD (Barbadian Dollar)",
  "BYN (Belarusian Ruble)",
  "BZD (Belize Dollar)",
  "XOF (West African CFA Franc)",
  "BTN (Bhutanese Ngultrum)",
  "BOB (Bolivian Boliviano)",
  "BAM (Bosnia and Herzegovina Convertible Mark)",
  "BWP (Botswana Pula)",
  "BRL (Brazilian Real)",
  "BND (Brunei Dollar)",
  "BGN (Bulgarian Lev)",
  "BIF (Burundian Franc)",
  "CVE (Cape Verdean Escudo)",
  "KHR (Cambodian Riel)",
  "XAF (Central African CFA Franc)",
  "CAD (Canadian Dollar)",
  "CLP (Chilean Peso)",
  "CNY (Chinese Yuan)",
  "COP (Colombian Peso)",
  "KMF (Comorian Franc)",
  "CDF (Congolese Franc)",
  "CRC (Costa Rican Colón)",
  "HRK (Croatian Kuna)",
  "CUP (Cuban Peso)",
  "CZK (Czech Koruna)",
  "DKK (Danish Krone)",
  "DJF (Djiboutian Franc)",
  "DOP (Dominican Peso)",
  "USD (Ecuadorian Dollar)",
  "EGP (Egyptian Pound)",
  "USD (Salvadoran Dollar)",
  "ERN (Eritrean Nakfa)",
  "SZL (Eswatini Lilangeni)",
  "ETB (Ethiopian Birr)",
  "FJD (Fijian Dollar)",
  "GMD (Gambian Dalasi)",
  "GEL (Georgian Lari)",
  "GHS (Ghanaian Cedi)",
  "GTQ (Guatemalan Quetzal)",
  "GNF (Guinean Franc)",
  "GYD (Guyanese Dollar)",
  "HTG (Haitian Gourde)",
  "HNL (Honduran Lempira)",
  "HUF (Hungarian Forint)",
  "ISK (Icelandic Krona)",
  "INR (Indian Rupee)",
  "IDR (Indonesian Rupiah)",
  "IRR (Iranian Rial)",
  "IQD (Iraqi Dinar)",
  "ILS (Israeli New Shekel)",
  "JMD (Jamaican Dollar)",
  "JPY (Japanese Yen)",
  "JOD (Jordanian Dinar)",
  "KZT (Kazakhstani Tenge)",
  "KES (Kenyan Shilling)",
  "AUD (Kiribati Dollar)",
  "KPW (North Korean Won)",
  "KRW (South Korean Won)",
  "KWD (Kuwaiti Dinar)",
  "KGS (Kyrgyzstani Som)",
  "LAK (Lao Kip)",
  "LBP (Lebanese Pound)",
  "LSL (Lesotho Loti)",
  "LRD (Liberian Dollar)",
  "LYD (Libyan Dinar)",
  "CHF (Swiss Franc)",
  "MGA (Malagasy Ariary)",
  "MWK (Malawian Kwacha)",
  "MYR (Malaysian Ringgit)",
  "MVR (Maldivian Rufiyaa)",
  "MRU (Mauritanian Ouguiya)",
  "MUR (Mauritian Rupee)",
  "MXN (Mexican Peso)",
  "MDL (Moldovan Leu)",
  "MNT (Mongolian Tugrik)",
  "MAD (Moroccan Dirham)",
  "MZN (Mozambican Metical)",
  "MMK (Myanmar Kyat)",
  "NAD (Namibian Dollar)",
  "AUD (Nauruan Dollar)",
  "NPR (Nepalese Rupee)",
  "NZD (New Zealand Dollar)",
  "NIO (Nicaraguan Córdoba)",
  "NGN (Nigerian Naira)",
  "MKD (North Macedonian Denar)",
  "NOK (Norwegian Krone)",
  "OMR (Omani Rial)",
  "PKR (Pakistani Rupee)",
  "PAB (Panamanian Balboa)",
  "PGK (Papua New Guinean Kina)",
  "PYG (Paraguayan Guarani)",
  "PEN (Peruvian Sol)",
  "PHP (Philippine Peso)",
  "PLN (Polish Zloty)",
  "QAR (Qatari Riyal)",
  "RON (Romanian Leu)",
  "RUB (Russian Ruble)",
  "RWF (Rwandan Franc)",
  "WST (Samoan Tala)",
  "STN (Sao Tome and Principe Dobra)",
  "SAR (Saudi Riyal)",
  "RSD (Serbian Dinar)",
  "SCR (Seychellois Rupee)",
  "SLL (Sierra Leonean Leone)",
  "SGD (Singapore Dollar)",
  "SBD (Solomon Islands Dollar)",
  "SOS (Somali Shilling)",
  "ZAR (South African Rand)",
  "SSP (South Sudanese Pound)",
  "LKR (Sri Lankan Rupee)",
  "SDG (Sudanese Pound)",
  "SRD (Surinamese Dollar)",
  "SEK (Swedish Krona)",
  "SYP (Syrian Pound)",
  "TJS (Tajikistani Somoni)",
  "TZS (Tanzanian Shilling)",
  "THB (Thai Baht)",
  "USD (Timorese Dollar)",
  "TOP (Tongan Paʻanga)",
  "TTD (Trinidad and Tobago Dollar)",
  "TND (Tunisian Dinar)",
  "TRY (Turkish Lira)",
  "TMT (Turkmenistani Manat)",
  "AUD (Tuvaluan Dollar)",
  "UGX (Ugandan Shilling)",
  "UAH (Ukrainian Hryvnia)",
  "AED (Emirati Dirham)",
  "GBP (British Pound)",
  "USD (United States Dollar)",
  "UYU (Uruguayan Peso)",
  "UZS (Uzbekistani Som)",
  "VUV (Vanuatu Vatu)",
  "VES (Venezuelan Bolívar)",
  "VND (Vietnamese Dong)",
  "YER (Yemeni Rial)",
  "ZMW (Zambian Kwacha)",
  "ZWL (Zimbabwean Dollar)",
];


const db = new pg.Client({
  user: pgUser,
  host: pgHost,
  database: pgDatabase,
  password: process.env.PG_PASSWORD,
  port: pgPort,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 } // Set cookie expiration time (in milliseconds)
}));

app.use(passport.initialize());
app.use(passport.session());


//const upload = multer({ dest: 'uploads/' }); //  use this if you are not renaming
//configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'c:/Users/Precision5540/Music/Backend/Allanite Research Center/public/uploads'); // Directory where files will be saved
    },
    filename: function (req, file, cb) {
      // Generate a unique filename, including the original filename.
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname);
      const originalNameWithoutExt = path.basename(file.originalname, fileExtension); // Get the original name without the extension.
    
      // Combine the original name (without extension), a unique suffix, and the extension.
      cb(null, originalNameWithoutExt + '-' + uniqueSuffix + fileExtension);
    }
});

const upload = multer({ storage: storage });

// Middleware to parse form data
app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded form data
//app.use(express.json()); // DO NOT USE THIS.  The form is not JSON.

app.post('/buy', upload.fields([
  { name: 'final_documents[]', maxCount: 100 }, // Corrected name to vl1_documents
]), async (req, res) => {
  try {
    const getLatestCompanyQuery = `
      SELECT c_id
      FROM Companyinfo
      ORDER BY c_datem DESC
      LIMIT 1;
    `;
    const latestCompanyResult = await db.query(getLatestCompanyQuery);
    if (latestCompanyResult && latestCompanyResult.rows && latestCompanyResult.rows.length > 0) {
      console.log(latestCompanyResult.rows[0].c_id);
    } else {
      console.log("No company found");
      return res.status(404).send("No company found"); // Use return to exit the handler
    }
    const c_id = latestCompanyResult.rows[0].c_id;

    // Comments (New Questions) - Corrected variable names to match the HTML form
    const anythingWrongComment = req.body.anything_wrong_comment;
    const permanentCapitalLossComment = req.body.permanent_capital_loss_comment;
    const wcwgSignificanceComment = req.body.wcwg_significance_comment;
    const timeHorizonComment = req.body.time_horizon_comment;
    const opportunityAttractivenessComment = req.body.opportunity_attractiveness_comment;
    const biasesCloudJudgementComment = req.body.biases_cloud_judgement_comment;
    const stockCheapComment = req.body.stock_cheap_comment;
    const infatuatedStockComment = req.body.infatuated_stock_comment;
    const wcgwMitigatingFactorsComment = req.body.wcgw_mitigating_factors_comment;
    const daysReassessingComment = req.body.days_reassessing_comment;
    const decisionPastPerformanceComment = req.body.decision_past_performance_comment;
    const buyingNearLowComment = req.body.buying_near_low_comment;
    const generalSentimentsPositiveComment = req.body.general_sentiments_positive_comment;
    const marketClosedFiveYearsComment = req.body.market_closed_five_years_comment;
    const reasonsToOwnComment = req.body.reasons_to_own_comment;
    const understandBusinessComment = req.body.understand_business_comment;
    const downsideProtectionComment = req.body.downside_protection_comment;
    const stayingPowerComment = req.body.staying_power_comment;
    const mediocreIdeaComment = req.body.mediocre_idea_comment;
    const compromiseSafetyQualityComment = req.body.compromise_safety_quality_comment;
    const tooHardBasketComment = req.body.too_hard_basket_comment;
    const cashInsteadComment = req.body.cash_instead_comment;
    const waitForEvidenceComment = req.body.wait_for_evidence_comment;
    const primaryReasonUndervaluedComment = req.body.primary_reason_undervalued_comment;
    const studiedIndustryComment = req.body.studied_industry_comment;
    const recheckAssumptionsComment = req.body.recheck_assumptions_comment;
    const figureTooGoodComment = req.body.figure_too_good_comment;
    const otherSecuritiesComment = req.body.other_securities_comment;
    const marketOvervaluedComment = req.body.market_overvalued_comment;

    // Radio Boxes (New Questions) - Corrected variable names to match the HTML form
    const anythingWrongQuestion = req.body.anything_wrong;
    const permanentCapitalLossQuestion = req.body.permanent_capital_loss;
    const wcwgSignificanceQuestion = req.body.wcwg_significance;
    const timeHorizonQuestion = req.body.time_horizon;
    const opportunityAttractivenessQuestion = req.body.opportunity_attractiveness;
    const biasesCloudJudgementQuestion = req.body.biases_cloud_judgement;
    const stockCheapQuestion = req.body.stock_cheap;
    const infatuatedStockQuestion = req.body.infatuated_stock;
    const wcgwMitigatingFactorsQuestion = req.body.wcgw_mitigating_factors;
    const daysReassessingQuestion = req.body.days_reassessing;
    const decisionPastPerformanceQuestion = req.body.decision_past_performance;
    const buyingNearLowQuestion = req.body.buying_near_low;
    const generalSentimentsPositiveQuestion = req.body.general_sentiments_positive;
    const marketClosedFiveYearsQuestion = req.body.market_closed_five_years;
    const understandBusinessQuestion = req.body.understand_business;
    const downsideProtectionQuestion = req.body.downside_protection;
    const stayingPowerQuestion = req.body.staying_power;
    const mediocreIdeaQuestion = req.body.mediocre_idea;
    const compromiseSafetyQualityQuestion = req.body.compromise_safety_quality;
    const tooHardBasketQuestion = req.body.too_hard_basket;
    const cashInsteadQuestion = req.body.cash_instead;
    const waitForEvidenceQuestion = req.body.wait_for_evidence;
    const primaryReasonUndervaluedQuestion = req.body.primary_reason_undervalued;
    const studiedIndustryQuestion = req.body.studied_industry;
    const recheckAssumptionsQuestion = req.body.recheck_assumptions;
    const figureTooGoodQuestion = req.body.figure_too_good;
    const otherSecuritiesQuestion = req.body.other_securities;
    const marketOvervaluedQuestion = req.body.market_overvalued;

    // Get uploaded files - Use req.files, not req.body for files.  Corrected to 'vl1_documents'
    const finalUploads = req.files['final_documents[]'] || [];

    // multer adds path, filename, originalname, size, mimetype
    // File details are now in arrays of objects
    const finalUploadsDetails = finalUploads.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      path: file.path
    }));

    // Log the extracted data (for demonstration)
    console.log({
      c_id,
      anythingWrongComment, anythingWrongQuestion,
      permanentCapitalLossComment, permanentCapitalLossQuestion,
      wcwgSignificanceComment, wcwgSignificanceQuestion,
      timeHorizonComment, timeHorizonQuestion,
      opportunityAttractivenessComment, opportunityAttractivenessQuestion,
      biasesCloudJudgementComment, biasesCloudJudgementQuestion,
      stockCheapComment, stockCheapQuestion,
      infatuatedStockComment, infatuatedStockQuestion,
      wcgwMitigatingFactorsComment, wcgwMitigatingFactorsQuestion,
      daysReassessingComment, daysReassessingQuestion,
      decisionPastPerformanceComment, decisionPastPerformanceQuestion,
      buyingNearLowComment, buyingNearLowQuestion,
      generalSentimentsPositiveComment, generalSentimentsPositiveQuestion,
      marketClosedFiveYearsComment, marketClosedFiveYearsQuestion,
      reasonsToOwnComment,
      understandBusinessComment, understandBusinessQuestion,
      downsideProtectionComment, downsideProtectionQuestion,
      stayingPowerComment, stayingPowerQuestion,
      mediocreIdeaComment, mediocreIdeaQuestion,
      compromiseSafetyQualityComment, compromiseSafetyQualityQuestion,
      tooHardBasketComment, tooHardBasketQuestion,
      cashInsteadComment, cashInsteadQuestion,
      waitForEvidenceComment, waitForEvidenceQuestion,
      primaryReasonUndervaluedComment, primaryReasonUndervaluedQuestion,
      studiedIndustryComment, studiedIndustryQuestion,
      recheckAssumptionsComment, recheckAssumptionsQuestion,
      figureTooGoodComment, figureTooGoodQuestion,
      otherSecuritiesComment, otherSecuritiesQuestion,
      marketOvervaluedComment, marketOvervaluedQuestion,
      finalUploadsDetails
    });

    try {
      const insertQuery = `
          INSERT INTO final (
            c_id,
            anythingWrongComment, anythingWrongQuestion,
            permanentCapitalLossComment, permanentCapitalLossQuestion,
            wcwgSignificanceComment, wcwgSignificanceQuestion,
            timeHorizonComment, timeHorizonQuestion,
            opportunityAttractivenessComment, opportunityAttractivenessQuestion,
            biasesCloudJudgementComment, biasesCloudJudgementQuestion,
            stockCheapComment, stockCheapQuestion,
            infatuatedStockComment, infatuatedStockQuestion,
            wcgwMitigatingFactorsComment, wcgwMitigatingFactorsQuestion,
            daysReassessingComment, daysReassessingQuestion,
            decisionPastPerformanceComment, decisionPastPerformanceQuestion,
            buyingNearLowComment, buyingNearLowQuestion,
            generalSentimentsPositiveComment, generalSentimentsPositiveQuestion,
            marketClosedFiveYearsComment, marketClosedFiveYearsQuestion,
            reasonsToOwnComment,
            understandBusinessComment, understandBusinessQuestion,
            downsideProtectionComment, downsideProtectionQuestion,
            stayingPowerComment, stayingPowerQuestion,
            mediocreIdeaComment, mediocreIdeaQuestion,
            compromiseSafetyQualityComment, compromiseSafetyQualityQuestion,
            tooHardBasketComment, tooHardBasketQuestion,
            cashInsteadComment, cashInsteadQuestion,
            waitForEvidenceComment, waitForEvidenceQuestion,
            primaryReasonUndervaluedComment, primaryReasonUndervaluedQuestion,
            studiedIndustryComment, studiedIndustryQuestion,
            recheckAssumptionsComment, recheckAssumptionsQuestion,
            figureTooGoodComment, figureTooGoodQuestion,
            otherSecuritiesComment, otherSecuritiesQuestion,
            marketOvervaluedComment, marketOvervaluedQuestion,
            finalUploadsDetails
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
            $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
            $51, $52, $53, $54, $55, $56, $57, $58, $59
          );
        `;

      const values = [
        c_id,
        anythingWrongComment, anythingWrongQuestion,
        permanentCapitalLossComment, permanentCapitalLossQuestion,
        wcwgSignificanceComment, wcwgSignificanceQuestion,
        timeHorizonComment, timeHorizonQuestion,
        opportunityAttractivenessComment, opportunityAttractivenessQuestion,
        biasesCloudJudgementComment, biasesCloudJudgementQuestion,
        stockCheapComment, stockCheapQuestion,
        infatuatedStockComment, infatuatedStockQuestion,
        wcgwMitigatingFactorsComment, wcgwMitigatingFactorsQuestion,
        daysReassessingComment, daysReassessingQuestion,
        decisionPastPerformanceComment, decisionPastPerformanceQuestion,
        buyingNearLowComment, buyingNearLowQuestion,
        generalSentimentsPositiveComment, generalSentimentsPositiveQuestion,
        marketClosedFiveYearsComment, marketClosedFiveYearsQuestion,
        reasonsToOwnComment,
        understandBusinessComment, understandBusinessQuestion,
        downsideProtectionComment, downsideProtectionQuestion,
        stayingPowerComment, stayingPowerQuestion,
        mediocreIdeaComment, mediocreIdeaQuestion,
        compromiseSafetyQualityComment, compromiseSafetyQualityQuestion,
        tooHardBasketComment, tooHardBasketQuestion,
        cashInsteadComment, cashInsteadQuestion,
        waitForEvidenceComment, waitForEvidenceQuestion,
        primaryReasonUndervaluedComment, primaryReasonUndervaluedQuestion,
        studiedIndustryComment, studiedIndustryQuestion,
        recheckAssumptionsComment, recheckAssumptionsQuestion,
        figureTooGoodComment, figureTooGoodQuestion,
        otherSecuritiesComment, otherSecuritiesQuestion,
        marketOvervaluedComment, marketOvervaluedQuestion,
        JSON.stringify(finalUploadsDetails) // Corrected variable name
      ];

      await db.query(insertQuery, values);


      let score = 0;
      const questions = [ // Corrected question names to match the form
        "anythingWrongQuestion",
        "permanentCapitalLossQuestion",
        "wcwgSignificanceQuestion",
        "timeHorizonQuestion",
        "opportunityAttractivenessQuestion",
        "biasesCloudJudgementQuestion",
        "stockCheapQuestion",
        "infatuatedStockQuestion",
        "wcgwMitigatingFactorsQuestion",
        "daysReassessingQuestion",
        "decisionPastPerformanceQuestion",
        "buyingNearLowQuestion",
        "generalSentimentsPositiveQuestion",
        "marketClosedFiveYearsQuestion",
        "understandBusinessQuestion",
        "downsideProtectionQuestion",
        "stayingPowerQuestion",
        "mediocreIdeaQuestion",
        "compromiseSafetyQualityQuestion",
        "tooHardBasketQuestion",
        "cashInsteadQuestion",
        "waitForEvidenceQuestion",
        "primaryReasonUndervaluedQuestion",
        "studiedIndustryQuestion",
        "recheckAssumptionsQuestion",
        "figureTooGoodQuestion",
        "otherSecuritiesQuestion",
        "marketOvervaluedQuestion"
      ];

      const questionValues = {  // Corrected question names to match the form
        anythingWrongQuestion: parseInt(anythingWrongQuestion, 10),
        permanentCapitalLossQuestion: parseInt(permanentCapitalLossQuestion, 10),
        wcwgSignificanceQuestion: parseInt(wcwgSignificanceQuestion, 10),
        timeHorizonQuestion: parseInt(timeHorizonQuestion, 10),
        opportunityAttractivenessQuestion: parseInt(opportunityAttractivenessQuestion, 10),
        biasesCloudJudgementQuestion: parseInt(biasesCloudJudgementQuestion, 10),
        stockCheapQuestion: parseInt(stockCheapQuestion, 10),
        infatuatedStockQuestion: parseInt(infatuatedStockQuestion, 10),
        wcgwMitigatingFactorsQuestion: parseInt(wcgwMitigatingFactorsQuestion, 10),
        daysReassessingQuestion: parseInt(daysReassessingQuestion, 10),
        decisionPastPerformanceQuestion: parseInt(decisionPastPerformanceQuestion, 10),
        buyingNearLowQuestion: parseInt(buyingNearLowQuestion, 10),
        generalSentimentsPositiveQuestion: parseInt(generalSentimentsPositiveQuestion, 10),
        marketClosedFiveYearsQuestion: parseInt(marketClosedFiveYearsQuestion, 10),
        understandBusinessQuestion: parseInt(understandBusinessQuestion, 10),
        downsideProtectionQuestion: parseInt(downsideProtectionQuestion, 10),
        stayingPowerQuestion: parseInt(stayingPowerQuestion, 10),
        mediocreIdeaQuestion: parseInt(mediocreIdeaQuestion, 10),
        compromiseSafetyQualityQuestion: parseInt(compromiseSafetyQualityQuestion, 10),
        tooHardBasketQuestion: parseInt(tooHardBasketQuestion, 10),
        cashInsteadQuestion: parseInt(cashInsteadQuestion, 10),
        waitForEvidenceQuestion: parseInt(waitForEvidenceQuestion, 10),
        primaryReasonUndervaluedQuestion: parseInt(primaryReasonUndervaluedQuestion, 10),
        studiedIndustryQuestion: parseInt(studiedIndustryQuestion, 10),
        recheckAssumptionsQuestion: parseInt(recheckAssumptionsQuestion, 10),
        figureTooGoodQuestion: parseInt(figureTooGoodQuestion, 10),
        otherSecuritiesQuestion: parseInt(otherSecuritiesQuestion, 10),
        marketOvervaluedQuestion: parseInt(marketOvervaluedQuestion, 10)
      };

      questions.forEach(questionKey => {
        const answerValue = questionValues[questionKey];
        if (!isNaN(answerValue)) {
          score += answerValue;
        }
      });

      const Creator = "admin";
      const DateM = new Date().toISOString();
      const Comp = "100";
      const Score = score.toString(); // Convert the score to a string
      const Status = "Purchased";
      const maxScore = 211;


      const updateCompanyQuery = `
          UPDATE companyinfo
          SET c_creator = $1, c_datem = $2, c_comp = $3, c_score = c_score + $4, c_status = $5, maximum_score = $6
          WHERE
          c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1);
        `;
      const updateValues = [Creator, DateM, Comp, Score, Status, maxScore];
      await db.query(updateCompanyQuery, updateValues);


    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ message: 'Database operation failed.', error: dbError.message });
    }
  } catch (error) {
    console.error('Error processing form data:', error);
    res.status(500).json({ message: 'An error occurred while processing the form data.', error: error.message });
  }
  // 2. Retrieve the last inserted row
  const lastInserted = await db.query(
    `SELECT * FROM companyinfo ORDER BY c_datem DESC LIMIT 1`
  );

  // 3. Render the tracker.ejs template with the data
  const currentscore = await db.query(`
        SELECT c_score
        FROM companyinfo
        WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
      `);

  const maxScore = await db.query(`
        SELECT maximum_score
        FROM companyinfo
        WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
      `);

  const mos = await db.query(`
        SELECT mos
        FROM vl1
        WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
      `);

  const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10);
  const maxScoreInt = parseInt(maxScore.rows[0].maximum_score, 10);
  res.redirect('/');
});

app.post('/final', async (req, res) => {
  try {
    const getLatestCompanyQuery = `
      SELECT c_id
      FROM Companyinfo
      ORDER BY c_datem DESC
      LIMIT 1;
    `;
    const latestCompanyResult = await db.query(getLatestCompanyQuery);

    if (!latestCompanyResult || !latestCompanyResult.rows || latestCompanyResult.rows.length === 0) {
      console.log("No company found");
      return res.status(404).send("No company found");
    }

    const c_id = latestCompanyResult.rows[0].c_id;

    // Retrieve the last inserted row using the retrieved c_id
    const lastInsertedQuery = `
      SELECT *
      FROM companyinfo
      WHERE c_id = $1;
    `;
    const lastInsertedResult = await db.query(lastInsertedQuery, [c_id]);

    if (!lastInsertedResult || !lastInsertedResult.rows || lastInsertedResult.rows.length === 0) {
      console.log("Error retrieving company info");
      return res.status(500).send("Error retrieving company information");
    }

    // Retrieve the current score using the retrieved c_id
    const currentScoreQuery = `
      SELECT c_score
      FROM companyinfo
      WHERE c_id = $1;
    `;
    const currentScoreResult = await db.query(currentScoreQuery, [c_id]);

                const Creator = "admin";
                const DateM = new Date().toISOString();
                const Comp = "90";
                const Status = "Buy Review";

                const updateCompanyQuery = `
                UPDATE companyinfo
                SET c_creator = $1, c_datem = $2, c_comp = $3, c_status = $4
                WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1);
              `;
              const updateValues = [Creator, DateM, Comp, Status];
              await db.query(updateCompanyQuery, updateValues);

    // Retrieve the maximum score using the retrieved c_id
    const maxScoreQuery = `
      SELECT maximum_score
      FROM companyinfo
      WHERE c_id = $1;
    `;
    const maxScoreResult = await db.query(maxScoreQuery, [c_id]);

    if (!currentScoreResult || !currentScoreResult.rows || currentScoreResult.rows.length === 0 ||
        !maxScoreResult || !maxScoreResult.rows || maxScoreResult.rows.length === 0) {
      console.log("Error retrieving scores");
      return res.status(500).send("Error retrieving scores");
    }

    const currentScoreInt = parseInt(currentScoreResult.rows[0].c_score, 10);
    const maxScoreInt = parseInt(maxScoreResult.rows[0].maximum_score, 10);

    const percentage = Math.round((currentScoreInt / maxScoreInt) * 100);
    console.log(percentage);

    res.render("final.ejs", { company: lastInsertedResult.rows[0], score: percentage });

  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/submit-vl2', upload.fields([
  { name: 'vl2_documents[]', maxCount: 100 },
]), async (req, res) => {
      try {
        const getLatestCompanyQuery = `
        SELECT c_id
        FROM Companyinfo
        ORDER BY c_datem DESC
        LIMIT 1;
      `;
        const latestCompanyResult = await db.query(getLatestCompanyQuery);
        if (latestCompanyResult && latestCompanyResult.rows && latestCompanyResult.rows.length > 0) {
          console.log(latestCompanyResult.rows[0].c_id);
        } else {
          console.log("No company found");
          res.status(404).send("No company found");
        }
        const c_id = latestCompanyResult.rows[0].c_id

    // Comments (New Questions)
    const customerSatisfactionComment = req.body.customer_satisfaction_comment;
    const growthAssumptionsComment = req.body.growth_assumptions_comment;
    const valuationMethodComment = req.body.valuation_method_comment;
    const businessModelAssumptionsComment = req.body.business_model_assumptions_comment;
    const marginsReturnsComment = req.body.margins_returns_comment;
    const customerEmotionComment = req.body.customer_emotion_comment;
    const switchingCostsComment = req.body.switching_costs_comment;
    const socialConnectivityComment = req.body.social_connectivity_comment;
    const capitalStructureAssumptionsComment = req.body.capital_structure_assumptions_comment;
    const cyclicalityAssumptionsComment = req.body.cyclicality_assumptions_comment;
    const pendingEventsAssumptionsComment = req.body.pending_events_assumptions_comment;
    const businessEnvironmentAssumptionsComment = req.body.business_environment_assumptions_comment;
    const governmentRegulationAssumptionsComment = req.body.government_regulation_assumptions_comment;

    // Radio Boxes (New Questions)
    const customerSatisfactionQuestion = req.body.customer_satisfaction;
    const growthAssumptionsQuestion = req.body.growth_assumptions;
    const valuationMethodQuestion = req.body.valuation_method;
    const businessModelAssumptionsQuestion = req.body.business_model_assumptions;
    const marginsReturnsQuestion = req.body.margins_returns;
    const customerEmotionQuestion = req.body.customer_emotion;
    const switchingCostsQuestion = req.body.switching_costs;
    const socialConnectivityQuestion = req.body.social_connectivity;
    const capitalStructureAssumptionsQuestion = req.body.capital_structure_assumptions;
    const cyclicalityAssumptionsQuestion = req.body.cyclicality_assumptions;
    const pendingEventsAssumptionsQuestion = req.body.pending_events_assumptions;
    const businessEnvironmentAssumptionsQuestion = req.body.business_environment_assumptions;
    const governmentRegulationAssumptionsQuestion = req.body.government_regulation_assumptions;

      // Get uploaded files - Use req.files, not req.body for files
      const vl2Uploads = req.files['vl2_documents[]'] || [];

      //multer adds path, filename, originalname, size, mimetype
      // File details are now in arrays of objects
      const vl2UploadsDetails = vl2Uploads.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path
      }));

      // Log the extracted data (for demonstration)
    
      try {
        const insertQuery = `
            INSERT INTO vl2 (
                c_id,
                customerSatisfactionComment, customerSatisfactionQuestion,
                growthAssumptionsComment, growthAssumptionsQuestion,
                valuationMethodComment, valuationMethodQuestion,
                businessModelAssumptionsComment, businessModelAssumptionsQuestion,
                marginsReturnsComment, marginsReturnsQuestion,
                customerEmotionComment, customerEmotionQuestion,
                switchingCostsComment, switchingCostsQuestion,
                socialConnectivityComment, socialConnectivityQuestion,
                capitalStructureAssumptionsComment, capitalStructureAssumptionsQuestion,
                cyclicalityAssumptionsComment, cyclicalityAssumptionsQuestion,
                pendingEventsAssumptionsComment, pendingEventsAssumptionsQuestion,
                businessEnvironmentAssumptionsComment, businessEnvironmentAssumptionsQuestion,
                governmentRegulationAssumptionsComment, governmentRegulationAssumptionsQuestion,
                vl2UploadsDetails
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28 
            )
        `;

        const values = [
            c_id,
            customerSatisfactionComment, customerSatisfactionQuestion,
            growthAssumptionsComment, growthAssumptionsQuestion,
            valuationMethodComment, valuationMethodQuestion,
            businessModelAssumptionsComment, businessModelAssumptionsQuestion,
            marginsReturnsComment, marginsReturnsQuestion,
            customerEmotionComment, customerEmotionQuestion,
            switchingCostsComment, switchingCostsQuestion,
            socialConnectivityComment, socialConnectivityQuestion,
            capitalStructureAssumptionsComment, capitalStructureAssumptionsQuestion,
            cyclicalityAssumptionsComment, cyclicalityAssumptionsQuestion,
            pendingEventsAssumptionsComment, pendingEventsAssumptionsQuestion,
            businessEnvironmentAssumptionsComment, businessEnvironmentAssumptionsQuestion,
            governmentRegulationAssumptionsComment, governmentRegulationAssumptionsQuestion,
            JSON.stringify(vl2UploadsDetails)
        ];

        await db.query(insertQuery, values);


        let score = 0;
        const questions = [
            "customerSatisfactionQuestion",
            "growthAssumptionsQuestion",
            "valuationMethodQuestion",
            "businessModelAssumptionsQuestion",
            "marginsReturnsQuestion",
            "customerEmotionQuestion",
            "switchingCostsQuestion",
            "socialConnectivityQuestion",
            "capitalStructureAssumptionsQuestion",
            "cyclicalityAssumptionsQuestion",
            "pendingEventsAssumptionsQuestion",
            "businessEnvironmentAssumptionsQuestion",
            "governmentRegulationAssumptionsQuestion"
        ];
        
        const questionValues = {
            customerSatisfactionQuestion: parseInt(customerSatisfactionQuestion, 10),
            growthAssumptionsQuestion: parseInt(growthAssumptionsQuestion, 10),
            valuationMethodQuestion: parseInt(valuationMethodQuestion, 10),
            businessModelAssumptionsQuestion: parseInt(businessModelAssumptionsQuestion, 10),
            marginsReturnsQuestion: parseInt(marginsReturnsQuestion, 10),
            customerEmotionQuestion: parseInt(customerEmotionQuestion, 10),
            switchingCostsQuestion: parseInt(switchingCostsQuestion, 10),
            socialConnectivityQuestion: parseInt(socialConnectivityQuestion, 10),
            capitalStructureAssumptionsQuestion: parseInt(capitalStructureAssumptionsQuestion, 10),
            cyclicalityAssumptionsQuestion: parseInt(cyclicalityAssumptionsQuestion, 10),
            pendingEventsAssumptionsQuestion: parseInt(pendingEventsAssumptionsQuestion, 10),
            businessEnvironmentAssumptionsQuestion: parseInt(businessEnvironmentAssumptionsQuestion, 10),
            governmentRegulationAssumptionsQuestion: parseInt(governmentRegulationAssumptionsQuestion, 10)
        };

     questions.forEach(questionKey => {
         const answerValue = questionValues[questionKey];
         if (!isNaN(answerValue)) {
             score += answerValue;
         }
     });
              
                const Creator = "admin";
                const DateM = new Date().toISOString();
                const Comp = "80";
                const Score =  score.toString();// Convert the score to a string score.toString();
                const Status = "Decision";
                const maxScore = "16";
                

                const updateCompanyQuery = `
                UPDATE companyinfo
                SET c_creator = $1, c_datem = $2, c_comp = $3, c_score = c_score + $4, c_status = $5, maximum_score = maximum_score + $6
                WHERE
                c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1);
              `;
              const updateValues = [Creator, DateM, Comp, Score, Status, maxScore];
              await db.query(updateCompanyQuery, updateValues);
            

    } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ message: 'Database operation failed.', error: dbError.message });
    }
} catch (error) {
    console.error('Error processing form data:', error);
    res.status(500).json({ message: 'An error occurred while processing the form data.', error: error.message });
}
    // 2. Retrieve the last inserted row
    const lastInserted = await db.query(
      `SELECT * FROM companyinfo ORDER BY c_datem DESC LIMIT 1`
    );

    // 3. Render the tracker.ejs template with the data
          // 3. Render the tracker.ejs template with the data
          const currentscore = await db.query(`
            SELECT c_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const maxScore = await db.query(`
            SELECT maximum_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const mos = await db.query(`
            SELECT mos
            FROM vl1
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);

          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10);
          const maxScoreInt = parseInt(maxScore.rows[0].maximum_score, 10);
          const percentage = Math.round(currentScoreInt / maxScoreInt * 100);
        
          const mosValue = parseInt(mos.rows[0].mos, 10);

          res.render("score.ejs", { company: lastInserted.rows[0], score: percentage, mos: mosValue });
});

app.post('/submit-vl1', upload.fields([
  { name: 'vl1_documents[]', maxCount: 100 },
]), async (req, res) => {
      try {
        const getLatestCompanyQuery = `
        SELECT c_id
        FROM Companyinfo
        ORDER BY c_datem DESC
        LIMIT 1;
      `;
        const latestCompanyResult = await db.query(getLatestCompanyQuery);
        if (latestCompanyResult && latestCompanyResult.rows && latestCompanyResult.rows.length > 0) {
          console.log(latestCompanyResult.rows[0].c_id);
        } else {
          console.log("No company found");
          res.status(404).send("No company found");
        }
        const c_id = latestCompanyResult.rows[0].c_id

       // Comments (Margin of Safety Downwards)
    const marginOfSafetyComment = req.body.margin_of_safety_comment;
    const totalAddressableMarketComment = req.body.total_addressable_market_comment;
    const tamIncreasedComment = req.body.tam_increased_comment;
    const convertNearCustomersComment = req.body.convert_near_customers_comment;
    const resourcesAcceleratingGrowthComment = req.body.resources_accelerating_growth_comment;
    const competitionHurtingProfitabilityComment = req.body.competition_hurting_profitability_comment;
    const anticipateCustomerBehaviorComment = req.body.anticipate_customer_behavior_comment;
    const increasePurchaseComment = req.body.increase_purchase_comment;
    const adoptionCurveComment = req.body.adoption_curve_comment;
    const newProductAdoptionComment = req.body.new_product_adoption_comment;
    const contractualBusinessComment = req.body.contractual_business_comment;
    const churnRetentionRateComment = req.body.churn_retention_rate_comment;
    const customerLongevityComment = req.body.customer_longevity_comment;
    const valueTrapSignsComment = req.body.value_trap_signs_comment;
    const sharePrice = req.body.shareprice;
    const valuation = req.body.valuation;
    const mos = req.body.marginofsafety;

    // Radio Boxes (Margin of Safety Downwards)
    const marginOfSafetyQuestion = req.body.margin_of_safety;
    const totalAddressableMarketQuestion = req.body.total_addressable_market;
    const tamIncreasedQuestion = req.body.tam_increased;
    const convertNearCustomersQuestion = req.body.convert_near_customers;
    const resourcesAcceleratingGrowthQuestion = req.body.resources_accelerating_growth;
    const competitionHurtingProfitabilityQuestion = req.body.competition_hurting_profitability;
    const anticipateCustomerBehaviorQuestion = req.body.anticipate_customer_behavior;
    const increasePurchaseQuestion = req.body.increase_purchase;
    const adoptionCurveQuestion = req.body.adoption_curve;
    const newProductAdoptionQuestion = req.body.new_product_adoption;
    const contractualBusinessQuestion = req.body.contractual_business;
    const churnRetentionRateQuestion = req.body.churn_retention_rate;
    const customerLongevityQuestion = req.body.customer_longevity;
    const valueTrapSignsQuestion = req.body.value_trap_signs;

      // Get uploaded files - Use req.files, not req.body for files
      const vl1Uploads = req.files['vl1_documents[]'] || [];

      //multer adds path, filename, originalname, size, mimetype
      // File details are now in arrays of objects
      const vl1UploadsDetails = vl1Uploads.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path
      }));

      // Log the extracted data (for demonstration)
    
      try {
        const insertQuery = `
            INSERT INTO vl1 (
                c_id,
                marginOfSafetyComment, marginOfSafetyQuestion,
                totalAddressableMarketComment, totalAddressableMarketQuestion,
                tamIncreasedComment, tamIncreasedQuestion,
                convertNearCustomersComment, convertNearCustomersQuestion,
                resourcesAcceleratingGrowthComment, resourcesAcceleratingGrowthQuestion,
                competitionHurtingProfitabilityComment, competitionHurtingProfitabilityQuestion,
                anticipateCustomerBehaviorComment, anticipateCustomerBehaviorQuestion,
                increasePurchaseComment, increasePurchaseQuestion,
                adoptionCurveComment, adoptionCurveQuestion,
                newProductAdoptionComment, newProductAdoptionQuestion,
                contractualBusinessComment, contractualBusinessQuestion,
                churnRetentionRateComment, churnRetentionRateQuestion,
                customerLongevityComment, customerLongevityQuestion,
                valueTrapSignsComment, valueTrapSignsQuestion,
                vl1UploadsDetails,shareprice, valuation, mos
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
            )
        `;
    
        const values = [
            c_id,
            marginOfSafetyComment, marginOfSafetyQuestion,
            totalAddressableMarketComment, totalAddressableMarketQuestion,
            tamIncreasedComment, tamIncreasedQuestion,
            convertNearCustomersComment, convertNearCustomersQuestion,
            resourcesAcceleratingGrowthComment, resourcesAcceleratingGrowthQuestion,
            competitionHurtingProfitabilityComment, competitionHurtingProfitabilityQuestion,
            anticipateCustomerBehaviorComment, anticipateCustomerBehaviorQuestion,
            increasePurchaseComment, increasePurchaseQuestion,
            adoptionCurveComment, adoptionCurveQuestion,
            newProductAdoptionComment, newProductAdoptionQuestion,
            contractualBusinessComment, contractualBusinessQuestion,
            churnRetentionRateComment, churnRetentionRateQuestion,
            customerLongevityComment, customerLongevityQuestion,
            valueTrapSignsComment, valueTrapSignsQuestion,
            JSON.stringify(vl1UploadsDetails),sharePrice, valuation, mos
        ];

        await db.query(insertQuery, values);


let score = 0;
const questions = [
    "marginOfSafetyQuestion",
    "totalAddressableMarketQuestion",
    "tamIncreasedQuestion",
    "convertNearCustomersQuestion",
    "resourcesAcceleratingGrowthQuestion",
    "competitionHurtingProfitabilityQuestion",
    "anticipateCustomerBehaviorQuestion",
    "increasePurchaseQuestion",
    "adoptionCurveQuestion",
    "newProductAdoptionQuestion",
    "contractualBusinessQuestion",
    "churnRetentionRateQuestion",
    "customerLongevityQuestion",
    "valueTrapSignsQuestion"
];

const questionValues = {
    marginOfSafetyQuestion: parseInt(marginOfSafetyQuestion, 10),
    totalAddressableMarketQuestion: parseInt(totalAddressableMarketQuestion, 10),
    tamIncreasedQuestion: parseInt(tamIncreasedQuestion, 10),
    convertNearCustomersQuestion: parseInt(convertNearCustomersQuestion, 10),
    resourcesAcceleratingGrowthQuestion: parseInt(resourcesAcceleratingGrowthQuestion, 10),
    competitionHurtingProfitabilityQuestion: parseInt(competitionHurtingProfitabilityQuestion, 10),
    anticipateCustomerBehaviorQuestion: parseInt(anticipateCustomerBehaviorQuestion, 10),
    increasePurchaseQuestion: parseInt(increasePurchaseQuestion, 10),
    adoptionCurveQuestion: parseInt(adoptionCurveQuestion, 10),
    newProductAdoptionQuestion: parseInt(newProductAdoptionQuestion, 10),
    contractualBusinessQuestion: parseInt(contractualBusinessQuestion, 10),
    churnRetentionRateQuestion: parseInt(churnRetentionRateQuestion, 10),
    customerLongevityQuestion: parseInt(customerLongevityQuestion, 10),
    valueTrapSignsQuestion: parseInt(valueTrapSignsQuestion, 10)
};

     questions.forEach(questionKey => {
         const answerValue = questionValues[questionKey];
         if (!isNaN(answerValue)) {
             score += answerValue;
         }
     });
              
                const Creator = "admin";
                const DateM = new Date().toISOString();
                const Comp = "70";
                const Score =  score.toString();// Convert the score to a string score.toString();
                const Status = "Assessment";
                const maxScore = 25;
                

                const updateCompanyQuery = `
                UPDATE companyinfo
                SET c_creator = $1, c_datem = $2, c_comp = $3, c_score = c_score + $4, c_status = $5, maximum_score = maximum_score + $6
                WHERE
                c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1);
              `;
              const updateValues = [Creator, DateM, Comp, Score, Status, maxScore];
              await db.query(updateCompanyQuery, updateValues);
            

    } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ message: 'Database operation failed.', error: dbError.message });
    }
} catch (error) {
    console.error('Error processing form data:', error);
    res.status(500).json({ message: 'An error occurred while processing the form data.', error: error.message });
}
    // 2. Retrieve the last inserted row
    const lastInserted = await db.query(
      `SELECT * FROM companyinfo ORDER BY c_datem DESC LIMIT 1`
    );

          // 3. Render the tracker.ejs template with the data
          const currentscore = await db.query(`
            SELECT c_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const maxScore = await db.query(`
            SELECT maximum_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10);
          const maxScoreInt = parseInt(maxScore.rows[0].maximum_score, 10);
    
          const percentage = Math.round(currentScoreInt / maxScoreInt * 100);
          console.log(percentage)
    
          res.render("vl2.ejs", { company: lastInserted.rows[0], score: percentage});
}); 

app.post('/submit-utf2', upload.fields([
  { name: 'utf2_documents[]', maxCount: 100 },
]), async (req, res) => {
      try {
        const getLatestCompanyQuery = `
        SELECT c_id
        FROM Companyinfo
        ORDER BY c_datem DESC
        LIMIT 1;
      `;
        const latestCompanyResult = await db.query(getLatestCompanyQuery);
        if (latestCompanyResult && latestCompanyResult.rows && latestCompanyResult.rows.length > 0) {
          console.log(latestCompanyResult.rows[0].c_id);
        } else {
          console.log("No company found");
          res.status(404).send("No company found");
        }
        const c_id = latestCompanyResult.rows[0].c_id

                // Comments
        const interestCoverComment = req.body.interest_cover_comment;
        const loanCovenantsComment = req.body.loan_covenants_comment;
        const offBalanceLiabilitiesComment = req.body.off_balance_liabilities_comment;
        const hiddenValuesComment = req.body.hidden_values_comment;
        const cashConversionCycleComment = req.body.cash_conversion_cycle_comment;
        const capexDepreciationComment = req.body.capex_depreciation_comment;
        const cashflowAllocationComment = req.body.cashflow_allocation_comment;
        const futureCapexEquityComment = req.body.future_capex_equity_comment;
        const debtEquityTrendComment = req.body.debt_equity_trend_comment;
        const shareBuybackIssuesComment = req.body.share_buyback_issues_comment;
        const balanceSheetItemsComment = req.body.balance_sheet_items_comment;
        const balanceSheetChangesComment = req.body.balance_sheet_changes_comment;
        const capitalStructureComment = req.body.capital_structure_comment;

        // Radio Boxes
        const interestCoverQuestion = req.body.interest_cover;
        const loanCovenantsQuestion = req.body.loan_covenants;
        const offBalanceLiabilitiesQuestion = req.body.off_balance_liabilities;
        const hiddenValuesQuestion = req.body.hidden_values;
        const cashConversionCycleQuestion = req.body.cash_conversion_cycle;
        const capexDepreciationQuestion = req.body.capex_depreciation;
        const cashflowAllocationQuestion = req.body.cashflow_allocation;
        const futureCapexEquityQuestion = req.body.future_capex_equity;
        const debtEquityTrendQuestion = req.body.debt_equity_trend;
        const shareBuybackIssuesQuestion = req.body.share_buyback_issues;
        const balanceSheetItemsQuestion = req.body.balance_sheet_items;
        const balanceSheetChangesQuestion = req.body.balance_sheet_changes;
        const capitalStructureQuestion = req.body.capital_structure;

      // Get uploaded files - Use req.files, not req.body for files
      const utf2Uploads = req.files['utf2_documents[]'] || [];

      //multer adds path, filename, originalname, size, mimetype
      // File details are now in arrays of objects
      const utf2UploadsDetails = utf2Uploads.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path
      }));

      // Log the extracted data (for demonstration)
    
      try {
        const insertQuery = `
            INSERT INTO utf2 (
                c_id,
                interestCoverComment, interestCoverQuestion,
                loanCovenantsComment, loanCovenantsQuestion,
                offBalanceLiabilitiesComment, offBalanceLiabilitiesQuestion,
                hiddenValuesComment, hiddenValuesQuestion,
                cashConversionCycleComment, cashConversionCycleQuestion,
                capexDepreciationComment, capexDepreciationQuestion,
                cashflowAllocationComment, cashflowAllocationQuestion,
                futureCapexEquityComment, futureCapexEquityQuestion,
                debtEquityTrendComment, debtEquityTrendQuestion,
                shareBuybackIssuesComment, shareBuybackIssuesQuestion,
                balanceSheetItemsComment, balanceSheetItemsQuestion,
                balanceSheetChangesComment, balanceSheetChangesQuestion,
                capitalStructureComment, capitalStructureQuestion,
                utf2UploadsDetails
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
            )
        `;
    
        const values = [
            c_id,
            interestCoverComment, interestCoverQuestion,
            loanCovenantsComment, loanCovenantsQuestion,
            offBalanceLiabilitiesComment, offBalanceLiabilitiesQuestion,
            hiddenValuesComment, hiddenValuesQuestion,
            cashConversionCycleComment, cashConversionCycleQuestion,
            capexDepreciationComment, capexDepreciationQuestion,
            cashflowAllocationComment, cashflowAllocationQuestion,
            futureCapexEquityComment, futureCapexEquityQuestion,
            debtEquityTrendComment, debtEquityTrendQuestion,
            shareBuybackIssuesComment, shareBuybackIssuesQuestion,
            balanceSheetItemsComment, balanceSheetItemsQuestion,
            balanceSheetChangesComment, balanceSheetChangesQuestion,
            capitalStructureComment, capitalStructureQuestion,
            JSON.stringify(utf2UploadsDetails) // Assuming utf1UploadsDetails is a JSON object or array
        ];

        await db.query(insertQuery, values);
        let score = 0;
        const questions = [
            "interestCoverQuestion",
            "loanCovenantsQuestion",
            "offBalanceLiabilitiesQuestion",
            "hiddenValuesQuestion",
            "cashConversionCycleQuestion",
            "capexDepreciationQuestion",
            "cashflowAllocationQuestion",
            "futureCapexEquityQuestion",
            "debtEquityTrendQuestion",
            "shareBuybackIssuesQuestion",
            "balanceSheetItemsQuestion",
            "balanceSheetChangesQuestion",
            "capitalStructureQuestion"
        ];
        
        const questionValues = {
            interestCoverQuestion: parseInt(interestCoverQuestion, 10),
            loanCovenantsQuestion: parseInt(loanCovenantsQuestion, 10),
            offBalanceLiabilitiesQuestion: parseInt(offBalanceLiabilitiesQuestion, 10),
            hiddenValuesQuestion: parseInt(hiddenValuesQuestion, 10),
            cashConversionCycleQuestion: parseInt(cashConversionCycleQuestion, 10),
            capexDepreciationQuestion: parseInt(capexDepreciationQuestion, 10),
            cashflowAllocationQuestion: parseInt(cashflowAllocationQuestion, 10),
            futureCapexEquityQuestion: parseInt(futureCapexEquityQuestion, 10),
            debtEquityTrendQuestion: parseInt(debtEquityTrendQuestion, 10),
            shareBuybackIssuesQuestion: parseInt(shareBuybackIssuesQuestion, 10),
            balanceSheetItemsQuestion: parseInt(balanceSheetItemsQuestion, 10),
            balanceSheetChangesQuestion: parseInt(balanceSheetChangesQuestion, 10),
            capitalStructureQuestion: parseInt(capitalStructureQuestion, 10)
        };

     questions.forEach(questionKey => {
         const answerValue = questionValues[questionKey];
         if (!isNaN(answerValue)) {
             score += answerValue;
         }
     });
              
                const Creator = "admin";
                const DateM = new Date().toISOString();
                const Comp = "57";
                const Score =  score.toString();// Convert the score to a string score.toString();
                const Status = "Assessment";
                const maxScore = 23
                

                const updateCompanyQuery = `
                UPDATE companyinfo
                SET c_creator = $1, c_datem = $2, c_comp = $3, c_score = c_score + $4, c_status = $5, maximum_score = maximum_score + $6
                WHERE
                c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1);
              `;
              const updateValues = [Creator, DateM, Comp, Score, Status, maxScore];
              await db.query(updateCompanyQuery, updateValues);
            

    } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ message: 'Database operation failed.', error: dbError.message });
    }
} catch (error) {
    console.error('Error processing form data:', error);
    res.status(500).json({ message: 'An error occurred while processing the form data.', error: error.message });
}
    // 2. Retrieve the last inserted row
    const lastInserted = await db.query(
      `SELECT * FROM companyinfo ORDER BY c_datem DESC LIMIT 1`
    );

          // 3. Render the tracker.ejs template with the data
          const currentscore = await db.query(`
            SELECT c_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const maxScore = await db.query(`
            SELECT maximum_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10);
          const maxScoreInt = parseInt(maxScore.rows[0].maximum_score, 10);
    
          const percentage = Math.round(currentScoreInt / maxScoreInt * 100);
          console.log(percentage)
    
          res.render("vl1.ejs", { company: lastInserted.rows[0], score: percentage});
});

app.post('/submit-utf1', upload.fields([
  { name: 'utf1_documents[]', maxCount: 100 },
]), async (req, res) => {
      try {
        const getLatestCompanyQuery = `
        SELECT c_id
        FROM Companyinfo
        ORDER BY c_datem DESC
        LIMIT 1;
      `;
        const latestCompanyResult = await db.query(getLatestCompanyQuery);
        if (latestCompanyResult && latestCompanyResult.rows && latestCompanyResult.rows.length > 0) {
          console.log(latestCompanyResult.rows[0].c_id);
        } else {
          console.log("No company found");
          res.status(404).send("No company found");
        }
        const c_id = latestCompanyResult.rows[0].c_id

              // Comments
        const assetValueAttractiveComment = req.body.asset_value_attractive_comment;
        const capexSalesComment = req.body.capex_sales_comment;
        const fcfMarginComment = req.body.fcf_margin_comment;
        const salesEstimationComment = req.body.sales_estimation_comment;
        const earningsNavComment = req.body.earnings_nav_comment;
        const epsGrowthComment = req.body.eps_growth_comment;
        const ownerEarningsGrowthComment = req.body.owner_earnings_growth_comment;
        const fcfGrowthComment = req.body.fcf_growth_comment;
        const debtEquityComment = req.body.debt_equity_comment;
        const financialStrengthComment = req.body.financial_strength_comment;
        const roicComment = req.body.roic_comment;
        const roaComment = req.body.roa_comment;
        const roeComment = req.body.roe_comment;
        const piotroskiScoreComment = req.body.piotroski_score_comment;
        const consistencyComment = req.body.consistency_comment;
        const inventoryReceivableComment = req.body.inventory_receivable_comment;

        // Radio Boxes
        const assetValueAttractiveQuestion = req.body.asset_value_attractive;
        const capexSalesQuestion = req.body.capex_sales;
        const fcfMarginQuestion = req.body.fcf_margin;
        const salesEstimationQuestion = req.body.sales_estimation;
        const earningsNavQuestion = req.body.earnings_nav;
        const epsGrowthQuestion = req.body.eps_growth;
        const ownerEarningsGrowthQuestion = req.body.owner_earnings_growth;
        const fcfGrowthQuestion = req.body.fcf_growth;
        const debtEquityQuestion = req.body.debt_equity;
        const financialStrengthQuestion = req.body.financial_strength;
        const roicQuestion = req.body.roic;
        const roaQuestion = req.body.roa;
        const roeQuestion = req.body.roe;
        const piotroskiScoreQuestion = req.body.piotroski_score;
        const consistencyQuestion = req.body.consistency;
        const inventoryReceivableQuestion = req.body.inventory_receivable;

      // Get uploaded files - Use req.files, not req.body for files
      const utf1Uploads = req.files['utf1_documents[]'] || [];

      //multer adds path, filename, originalname, size, mimetype
      // File details are now in arrays of objects
      const utf1UploadsDetails = utf1Uploads.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path
      }));

      // Log the extracted data (for demonstration)
    
      try {
        const insertQuery = `
          INSERT INTO utf1 (
            c_id,
            assetValueAttractiveComment, assetValueAttractiveQuestion,
            capexSalesQuestion, capexSalesComment,
            fcfMarginComment, fcfMarginQuestion,
            salesEstimationComment, salesEstimationQuestion,
            earningsNavComment, earningsNavQuestion,
            epsGrowthComment, epsGrowthQuestion,
            ownerEarningsGrowthComment, ownerEarningsGrowthQuestion,
            fcfGrowthComment, fcfGrowthQuestion,
            debtEquityComment, debtEquityQuestion,
            financialStrengthComment, financialStrengthQuestion,
            roicComment, roicQuestion,
            roaComment, roaQuestion,
            roeComment, roeQuestion,
            piotroskiScoreComment, piotroskiScoreQuestion,
            consistencyComment, consistencyQuestion,
            inventoryReceivableComment, inventoryReceivableQuestion,
            utf1UploadsDetails
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
          )
        `;
      
        const values = [
          c_id,
          assetValueAttractiveComment, assetValueAttractiveQuestion,
          capexSalesQuestion, capexSalesComment,
          fcfMarginComment, fcfMarginQuestion,
          salesEstimationComment, salesEstimationQuestion,
          earningsNavComment, earningsNavQuestion,
          epsGrowthComment, epsGrowthQuestion,
          ownerEarningsGrowthComment, ownerEarningsGrowthQuestion,
          fcfGrowthComment, fcfGrowthQuestion,
          debtEquityComment, debtEquityQuestion,
          financialStrengthComment, financialStrengthQuestion,
          roicComment, roicQuestion,
          roaComment, roaQuestion,
          roeComment, roeQuestion,
          piotroskiScoreComment, piotroskiScoreQuestion,
          consistencyComment, consistencyQuestion,
          inventoryReceivableComment, inventoryReceivableQuestion,
          JSON.stringify(utf1UploadsDetails) // Assuming ma1UploadsDetails is a JSON object or array
        ];

        await db.query(insertQuery, values);
// 4. Calculate the score
let score = 0;
const questions = [
    "assetValueAttractiveQuestion",
    "capexSalesQuestion",
    "fcfMarginQuestion",
    "salesEstimationQuestion",
    "earningsNavQuestion",
    "epsGrowthQuestion",
    "ownerEarningsGrowthQuestion",
    "fcfGrowthQuestion",
    "debtEquityQuestion",
    "financialStrengthQuestion",
    "roicQuestion",
    "roaQuestion",
    "roeQuestion",
    "piotroskiScoreQuestion",
    "consistencyQuestion",
    "inventoryReceivableQuestion"
];

const questionValues = {
    assetValueAttractiveQuestion: parseInt(assetValueAttractiveQuestion, 10),
    capexSalesQuestion: parseInt(capexSalesQuestion, 10),
    fcfMarginQuestion: parseInt(fcfMarginQuestion, 10),
    salesEstimationQuestion: parseInt(salesEstimationQuestion, 10),
    earningsNavQuestion: parseInt(earningsNavQuestion, 10),
    epsGrowthQuestion: parseInt(epsGrowthQuestion, 10),
    ownerEarningsGrowthQuestion: parseInt(ownerEarningsGrowthQuestion, 10),
    fcfGrowthQuestion: parseInt(fcfGrowthQuestion, 10),
    debtEquityQuestion: parseInt(debtEquityQuestion, 10),
    financialStrengthQuestion: parseInt(financialStrengthQuestion, 10),
    roicQuestion: parseInt(roicQuestion, 10),
    roaQuestion: parseInt(roaQuestion, 10),
    roeQuestion: parseInt(roeQuestion, 10),
    piotroskiScoreQuestion: parseInt(piotroskiScoreQuestion, 10),
    consistencyQuestion: parseInt(consistencyQuestion, 10),
    inventoryReceivableQuestion: parseInt(inventoryReceivableQuestion, 10)
};

     questions.forEach(questionKey => {
         const answerValue = questionValues[questionKey];
         if (!isNaN(answerValue)) {
             score += answerValue;
         }
     });
              
                const Creator = "admin";
                const DateM = new Date().toISOString();
                const Comp = "50";
                const Score =  score.toString();// Convert the score to a string score.toString();
                const Status = "Assessment";
                const maxScore = 31
                

                const updateCompanyQuery = `
                UPDATE companyinfo
                SET c_creator = $1, c_datem = $2, c_comp = $3, c_score = c_score + $4, c_status = $5, maximum_score = maximum_score + $6
                WHERE
                c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1);
              `;
              const updateValues = [Creator, DateM, Comp, Score, Status, maxScore];
              await db.query(updateCompanyQuery, updateValues);
            

    } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ message: 'Database operation failed.', error: dbError.message });
    }
} catch (error) {
    console.error('Error processing form data:', error);
    res.status(500).json({ message: 'An error occurred while processing the form data.', error: error.message });
}
    // 2. Retrieve the last inserted row
    const lastInserted = await db.query(
      `SELECT * FROM companyinfo ORDER BY c_datem DESC LIMIT 1`
    );

    // 3. Render the tracker.ejs template with the data
           // 3. Render the tracker.ejs template with the data
           const currentscore = await db.query(`
            SELECT c_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const maxScore = await db.query(`
            SELECT maximum_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10);
          const maxScoreInt = parseInt(maxScore.rows[0].maximum_score, 10);
    
          const percentage = Math.round(currentScoreInt / maxScoreInt * 100);
          console.log(percentage)
    
          res.render("utf2.ejs", { company: lastInserted.rows[0], score: percentage});
});

app.post('/submit-ma1', upload.fields([
  { name: 'ma1_documents[]', maxCount: 100 },
]), async (req, res) => {
      try {
        const getLatestCompanyQuery = `
        SELECT c_id
        FROM Companyinfo
        ORDER BY c_datem DESC
        LIMIT 1;
      `;
        const latestCompanyResult = await db.query(getLatestCompanyQuery);
        if (latestCompanyResult && latestCompanyResult.rows && latestCompanyResult.rows.length > 0) {
          console.log(latestCompanyResult.rows[0].c_id);
        } else {
          console.log("No company found");
          res.status(404).send("No company found");
        }
        const c_id = latestCompanyResult.rows[0].c_id

      // Comments
      const managementOwnershipComment = req.body.management_ownership_comment;
      const managementExperienceComment = req.body.management_experience_comment;
      const managementOrientationComment = req.body.management_orientation_comment;
      const managementCandorComment = req.body.management_candor_comment;
      const capitalAllocationComment = req.body.capital_allocation_comment;
      const managementReputationComment = req.body.management_reputation_comment;
      const managementAdmirationComment = req.body.management_admiration_comment;
      const managementInnovationComment = req.body.management_innovation_comment;
      const managementDepthComment = req.body.management_depth_comment;
      const managementTransparencyComment = req.body.management_transparency_comment;
      const ceoLetterAnalysisComment = req.body.ceo_letter_analysis_comment;
      const executiveCompensationAnalysisComment = req.body.executive_compensation_analysis_comment;
      const managementSaidAnalysisComment = req.body.management_said_analysis_comment;
      const boardSizeComment = req.body.board_size_comment;
      const boardDepthComment = req.body.board_depth_comment;
      const ceoCompensationComment = req.body.ceo_compensation_comment;
      

      // Radio Boxes
      const managementOwnershipQuestion = req.body.management_ownership_question;
      const managementExperienceQuestion = req.body.management_experience_question;
      const managementOrientationQuestion = req.body.management_orientation_question;
      const managementCandorQuestion = req.body.management_candor_question;
      const capitalAllocationQuestion = req.body.capital_allocation_question;
      const managementReputationQuestion = req.body.management_reputation_question;
      const managementAdmirationQuestion = req.body.management_admiration_question;
      const managementInnovationQuestion = req.body.management_innovation_question;
      const managementDepthQuestion = req.body.management_depth_question;
      const managementTransparencyQuestion = req.body.management_transparency_question;
      const ceoLetterAnalysisQuestion = req.body.ceo_letter_analysis_question;
      const executiveCompensationAnalysisQuestion = req.body.executive_compensation_analysis_question;
      const managementSaidAnalysisQuestion = req.body.management_said_analysis_question;
      const boardSizeQuestion = req.body.board_size_question;
      const boardDepthQuestion = req.body.board_depth_question;
      const ceoCompensationQuestion = req.body.ceo_compensation_question;

      // Get uploaded files - Use req.files, not req.body for files
      const ma1Uploads = req.files['ma1_documents[]'] || [];

      //multer adds path, filename, originalname, size, mimetype
      // File details are now in arrays of objects
      const ma1UploadsDetails = ma1Uploads.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path
      }));

      // Log the extracted data (for demonstration)
    
      // 5. Database Insertion
      try {
        const insertQuery = `
          INSERT INTO ma1 (
            c_id,
            managementOwnershipComment, managementOwnershipQuestion,
            managementExperienceQuestion, managementExperienceComment,
            managementOrientationComment, managementOrientationQuestion,
            managementCandorComment, managementCandorQuestion,
            capitalAllocationComment, capitalAllocationQuestion,
            managementReputationComment, managementReputationQuestion,
            managementAdmirationComment, managementAdmirationQuestion,
            managementInnovationComment, managementInnovationQuestion,
            managementDepthComment, managementDepthQuestion,
            managementTransparencyComment, managementTransparencyQuestion,
            ceoLetterAnalysisComment, ceoLetterAnalysisQuestion,
            executiveCompensationAnalysisComment, executiveCompensationAnalysisQuestion,
            managementSaidAnalysisComment, managementSaidAnalysisQuestion,
            boardSizeComment, boardSizeQuestion,
            boardDepthComment, boardDepthQuestion,
            ceoCompensationComment, ceoCompensationQuestion,
            ma1UploadsDetails
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
          )
        `;
        
         const values = [
          c_id,
          managementOwnershipComment, managementOwnershipQuestion, 
          managementExperienceQuestion, managementExperienceComment,
          managementOrientationComment, managementOrientationQuestion,
          managementCandorComment, managementCandorQuestion,
          capitalAllocationComment, capitalAllocationQuestion,
          managementReputationComment, managementReputationQuestion,
          managementAdmirationComment, managementAdmirationQuestion,
          managementInnovationComment, managementInnovationQuestion,
          managementDepthComment, managementDepthQuestion,
          managementTransparencyComment, managementTransparencyQuestion,
          ceoLetterAnalysisComment, ceoLetterAnalysisQuestion,
          executiveCompensationAnalysisComment, executiveCompensationAnalysisQuestion,
          managementSaidAnalysisComment, managementSaidAnalysisQuestion,
          boardSizeComment, boardSizeQuestion,
          boardDepthComment, boardDepthQuestion,
          ceoCompensationComment, ceoCompensationQuestion, JSON.stringify(ma1UploadsDetails)
        ];

        await db.query(insertQuery, values);
// 4. Calculate the score
let score = 0;
const questions = [
    "managementOwnershipQuestion",
    "managementExperienceQuestion",
    "managementOrientationQuestion",
    "managementCandorQuestion",
    "capitalAllocationQuestion",
    "managementReputationQuestion",
    "managementAdmirationQuestion",
    "managementInnovationQuestion",
    "managementDepthQuestion",
    "managementTransparencyQuestion",
    "ceoLetterAnalysisQuestion",
    "executiveCompensationAnalysisQuestion",
    "managementSaidAnalysisQuestion",
    "boardSizeQuestion",
    "boardDepthQuestion",
    "ceoCompensationQuestion"
];

const questionValues = {
    managementOwnershipQuestion: parseInt(managementOwnershipQuestion, 10),
    managementExperienceQuestion:parseInt(managementExperienceQuestion, 10),
    managementOrientationQuestion: parseInt(managementOrientationQuestion, 10),
    managementCandorQuestion: parseInt(managementCandorQuestion, 10),
    capitalAllocationQuestion: parseInt(capitalAllocationQuestion, 10),
    managementReputationQuestion: parseInt(managementReputationQuestion, 10),
    managementAdmirationQuestion: parseInt(managementAdmirationQuestion, 10),
    managementInnovationQuestion: parseInt(managementInnovationQuestion, 10),
    managementDepthQuestion: parseInt(managementDepthQuestion, 10),
    managementTransparencyQuestion: parseInt(managementTransparencyQuestion, 10),
    ceoLetterAnalysisQuestion: parseInt(ceoLetterAnalysisQuestion, 10),
    executiveCompensationAnalysisQuestion: parseInt(executiveCompensationAnalysisQuestion, 10),
    managementSaidAnalysisQuestion: parseInt(managementSaidAnalysisQuestion, 10),
    boardSizeQuestion: parseInt(boardSizeQuestion, 10),
    boardDepthQuestion: parseInt(boardDepthQuestion, 10),
    ceoCompensationQuestion: parseInt(ceoCompensationQuestion, 10)
};

     questions.forEach(questionKey => {
         const answerValue = questionValues[questionKey];
         if (!isNaN(answerValue)) {
             score += answerValue;
         }
     });
              
                const Creator = "admin";
                const DateM = new Date().toISOString();
                const Comp = "43";
                const Score =  score.toString();// Convert the score to a string score.toString();
                const Status = "Assessment";
                const maxScore = 34
                

                const updateCompanyQuery = `
                UPDATE companyinfo
                SET c_creator = $1, c_datem = $2, c_comp = $3, c_score = c_score + $4, c_status = $5, maximum_score = maximum_score + $6
                WHERE
                c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1);
              `;
              const updateValues = [Creator, DateM, Comp, Score, Status, maxScore];
              await db.query(updateCompanyQuery, updateValues);
            

    } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ message: 'Database operation failed.', error: dbError.message });
    }
} catch (error) {
    console.error('Error processing form data:', error);
    res.status(500).json({ message: 'An error occurred while processing the form data.', error: error.message });
}
    // 2. Retrieve the last inserted row
    const lastInserted = await db.query(
      `SELECT * FROM companyinfo ORDER BY c_datem DESC LIMIT 1`
    );

    // 3. Render the tracker.ejs template with the data
          // 3. Render the tracker.ejs template with the data
          const currentscore = await db.query(`
            SELECT c_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const maxScore = await db.query(`
            SELECT maximum_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10);
          const maxScoreInt = parseInt(maxScore.rows[0].maximum_score, 10);
    
          const percentage = Math.round(currentScoreInt / maxScoreInt * 100);
          console.log(percentage)
    
          res.render("utf1.ejs", { company: lastInserted.rows[0], score: percentage});
});

app.post('/submit-utb2', upload.fields([
  { name: 'utb2_documents[]', maxCount: 100 },
]), async (req, res) => {
      try {
        const getLatestCompanyQuery = `
        SELECT c_id
        FROM Companyinfo
        ORDER BY c_datem DESC
        LIMIT 1;
      `;
        const latestCompanyResult = await db.query(getLatestCompanyQuery);
        if (latestCompanyResult && latestCompanyResult.rows && latestCompanyResult.rows.length > 0) {
          console.log(latestCompanyResult.rows[0].c_id);
        } else {
          console.log("No company found");
          res.status(404).send("No company found");
        }
        const c_id = latestCompanyResult.rows[0].c_id

      // Comments
      const stockPriceNewsComment = req.body.stock_price_news_comment;
      const industryOccurrenceComment = req.body.industry_occurrence_comment;
      const investeeCompetitorsComment = req.body.investee_competitors_comment;
      const competitorNumberComment = req.body.competitor_number_comment;
      const mergerListComment = req.body.merger_list_comment;
      const mergerPriceComment = req.body.merger_price_comment;
      const mergerPremiumComment = req.body.merger_premium_comment;
      const mergerSuccessComment = req.body.merger_success_comment;
      const growthHistoryComment = req.body.growth_history_comment;
      const suppliersListComment = req.body.suppliers_list_comment;
      const customersListComment = req.body.customers_list_comment;
      const supplierReplacementComment = req.body.supplier_replacement_comment;

      // Radio Boxes
      const stockPriceNewsQuestion = req.body.stock_price_news_question;
      const industryOccurrenceQuestion = req.body.industry_occurrence_question;
      const investeeCompetitorsQuestion = req.body.investee_competitors_question;
      const competitorNumberQuestion = req.body.competitor_number_question;
      const mergerListQuestion = req.body.merger_list_question;
      const mergerPriceQuestion = req.body.merger_price_question;
      const mergerPremiumQuestion = req.body.merger_premium_question;
      const mergerSuccessQuestion = req.body.merger_success_question;
      const growthHistoryQuestion = req.body.growth_history_question;
      const suppliersListQuestion = req.body.suppliers_list_question;
      const customersListQuestion = req.body.customers_list_question;
      const supplierReplacementQuestion = req.body.supplier_replacement_question;

      // Get uploaded files - Use req.files, not req.body for files
      const utb2Uploads = req.files['utb2_documents[]'] || [];

      //multer adds path, filename, originalname, size, mimetype
      // File details are now in arrays of objects
      const utb2UploadsDetails = utb2Uploads.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path
      }));

      // Log the extracted data (for demonstration)
    
      // 5. Database Insertion
try {
  const insertQuery = `
      INSERT INTO utb2 (
          c_id,
          stockPriceNewsComment, stockPriceNewsQuestion,
          industryOccurrenceComment, industryOccurrenceQuestion,
          investeeCompetitorsComment, investeeCompetitorsQuestion,
          competitorNumberComment, competitorNumberQuestion,
          mergerListComment, mergerListQuestion,
          mergerPriceComment, mergerPriceQuestion,
          mergerPremiumComment, mergerPremiumQuestion,
          mergerSuccessComment, mergerSuccessQuestion,
          growthHistoryComment, growthHistoryQuestion,
          suppliersListComment, suppliersListQuestion,
          customersListComment, customersListQuestion,
          supplierReplacementComment, supplierReplacementQuestion, utb2UploadsDetails
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      )
  `;

  const values = [
      c_id,
      stockPriceNewsComment, stockPriceNewsQuestion,
      industryOccurrenceComment, industryOccurrenceQuestion,
      investeeCompetitorsComment, investeeCompetitorsQuestion,
      competitorNumberComment, competitorNumberQuestion,
      mergerListComment, mergerListQuestion,
      mergerPriceComment, mergerPriceQuestion,
      mergerPremiumComment, mergerPremiumQuestion,
      mergerSuccessComment, mergerSuccessQuestion,
      growthHistoryComment, growthHistoryQuestion,
      suppliersListComment, suppliersListQuestion,
      customersListComment, customersListQuestion,
      supplierReplacementComment, supplierReplacementQuestion,
      JSON.stringify(utb2UploadsDetails)
  ];

        await db.query(insertQuery, values);
     // 4. Calculate the score
let score = 0;
const questions = [
    "stockPriceNewsQuestion", "industryOccurrenceQuestion", "investeeCompetitorsQuestion",
    "competitorNumberQuestion", "mergerListQuestion", "mergerPriceQuestion",
    "mergerPremiumQuestion", "mergerSuccessQuestion", "growthHistoryQuestion",
    "suppliersListQuestion", "customersListQuestion", "supplierReplacementQuestion"
];

const questionValues = {
    stockPriceNewsQuestion: parseInt(stockPriceNewsQuestion, 10),
    industryOccurrenceQuestion: parseInt(industryOccurrenceQuestion, 10),
    investeeCompetitorsQuestion: parseInt(investeeCompetitorsQuestion, 10),
    competitorNumberQuestion: parseInt(competitorNumberQuestion, 10),
    mergerListQuestion: parseInt(mergerListQuestion, 10),
    mergerPriceQuestion: parseInt(mergerPriceQuestion, 10),
    mergerPremiumQuestion: parseInt(mergerPremiumQuestion, 10),
    mergerSuccessQuestion: parseInt(mergerSuccessQuestion, 10),
    growthHistoryQuestion: parseInt(growthHistoryQuestion, 10),
    suppliersListQuestion: parseInt(suppliersListQuestion, 10),
    customersListQuestion: parseInt(customersListQuestion, 10),
    supplierReplacementQuestion: parseInt(supplierReplacementQuestion, 10)
};

     questions.forEach(questionKey => {
         const answerValue = questionValues[questionKey];
         if (!isNaN(answerValue)) {
             score += answerValue;
         }
     });
              
                const Creator = "admin";
                const DateM = new Date().toISOString();
                const Comp = "35";
                const Score =  score.toString();// Convert the score to a string score.toString();
                const Status = "Assessment";
                const maxScore = 15
                

                const updateCompanyQuery = `
                UPDATE companyinfo
                SET c_creator = $1, c_datem = $2, c_comp = $3, c_score = c_score + $4, c_status = $5, maximum_score = maximum_score + $6
                WHERE
                c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1);
              `;
              const updateValues = [Creator, DateM, Comp, Score, Status, maxScore];
              await db.query(updateCompanyQuery, updateValues);
            

    } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ message: 'Database operation failed.', error: dbError.message });
    }
} catch (error) {
    console.error('Error processing form data:', error);
    res.status(500).json({ message: 'An error occurred while processing the form data.', error: error.message });
}
    // 2. Retrieve the last inserted row
    const lastInserted = await db.query(
      `SELECT * FROM companyinfo ORDER BY c_datem DESC LIMIT 1`
    );

    // 3. Render the tracker.ejs template with the data
          // 3. Render the tracker.ejs template with the data
          const currentscore = await db.query(`
            SELECT c_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const maxScore = await db.query(`
            SELECT maximum_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10);
          const maxScoreInt = parseInt(maxScore.rows[0].maximum_score, 10);
    
          const percentage = Math.round(currentScoreInt / maxScoreInt * 100);
          console.log(percentage)
    
          res.render("ma1.ejs", { company: lastInserted.rows[0], score: percentage});
});

app.post('/submit-utb1', upload.fields([
  { name: 'utb1_documents[]', maxCount: 100 },
]), async (req, res) => {
      try {
        const getLatestCompanyQuery = `
        SELECT c_id
        FROM Companyinfo
        ORDER BY c_datem DESC
        LIMIT 1;
      `;
        const latestCompanyResult = await db.query(getLatestCompanyQuery);
        if (latestCompanyResult && latestCompanyResult.rows && latestCompanyResult.rows.length > 0) {
          console.log(latestCompanyResult.rows[0].c_id);
        } else {
          console.log("No company found");
          res.status(404).send("No company found");
        }
        const c_id = latestCompanyResult.rows[0].c_id

      //Comments
            const reinvestmentOpportunityComment = req.body.reinvestment_opportunity_comment;
            const competitiveAdvantageComment = req.body.competitive_advantage_comment;
            const marketShareComment = req.body.market_share_comment;
            const inflationProofComment = req.body.inflation_proof_comment;
            const imminentFactorsComment = req.body.imminent_factors_comment;
            const costStructureComment = req.body.cost_structure_comment;
            const shrinkingMarketsComment = req.body.shrinking_markets_comment;
            const marketPerceptionsComment = req.body.market_perceptions_comment;
            const operatingHistoryComment = req.body.operating_history_comment;
            const longTermProspectsComment = req.body.long_term_prospects_comment;
            const understandableBusinessComment = req.body.understandable_business_comment;
            const evaluatableCharacteristicsComment = req.body.evaluatable_characteristics_comment;
            const marketPotentialComment = req.body.market_potential_comment;
            const researchDevelopmentComment = req.body.research_development_comment;
            const salesOrganizationComment = req.body.sales_organization_comment;
            const laborRelationsComment = req.body.labor_relations_comment;
            const executiveRelationsComment = req.body.executive_relations_comment;
            const industryPeculiaritiesComment = req.body.industry_peculiarities_comment;
            const profitOutlookComment = req.body.profit_outlook_comment;
            const fadComment = req.body.fad_comment;
            const cyclicalDependentComment = req.body.cyclical_dependent_comment;
            const netCashGeneratorComment = req.body.net_cash_generator_comment;
            const economiesOfScaleScopeComment = req.body.economies_of_scale_scope_comment;
            const networkEffectComment = req.body.network_effect_comment;
            const intellectualPropertyRightsComment = req.body.intellectual_property_rights_comment;
            const highSwitchingCostsComment = req.body.high_switching_costs_comment
            const oligopolistMarketComment = req.body.oligopolist_market_comment

        //Radio Boxes

            const reinvestmentOpportunityQuestion = req.body.reinvestment_opportunity_question;
            const competitiveAdvantageQuestion = req.body.competitive_advantage_question;
            const marketShareQuestion = req.body.market_share_question;
            const inflationProofQuestion = req.body.inflation_proof_question;
            const imminentFactorsQuestion = req.body.imminent_factors_question;
            const costStructureQuestion = req.body.cost_structure_question;
            const shrinkingMarketsQuestion = req.body.shrinking_markets_question;
            const marketPerceptionsQuestion = req.body.market_perceptions_question;
            const operatingHistoryQuestion = req.body.operating_history_question;
            const longTermProspectsQuestion = req.body.long_term_prospects_question;
            const understandableBusinessQuestion = req.body.understandable_business_question;
            const evaluatableCharacteristicsQuestion = req.body.evaluatable_characteristics_question;
            const marketPotentialQuestion = req.body.market_potential_question;
            const researchDevelopmentQuestion = req.body.research_development_question;
            const salesOrganizationQuestion = req.body.sales_organization_question;
            const laborRelationsQuestion = req.body.labor_relations_question;
            const executiveRelationsQuestion = req.body.executive_relations_question;
            const industryPeculiaritiesQuestion = req.body.industry_peculiarities_question;
            const profitOutlookQuestion = req.body.profit_outlook_question;
            const fadQuestion = req.body.fad_question;
            const cyclicalDependentQuestion = req.body.cyclical_dependent_question;
            const netCashGeneratorQuestion = req.body.net_cash_generator_question;
            const economiesOfScaleScopeQuestion = req.body.economies_of_scale_scope_question;
            const networkEffectQuestion = req.body.network_effect_question;
            const intellectualPropertyRightsQuestion = req.body.intellectual_property_rights_question;
            const highSwitchingCostsQuestion = req.body.high_switching_costs_question
            const oligopolistMarketQuestion = req.body.oligopolist_market_question

      // Get uploaded files - Use req.files, not req.body for files
      const utb1Uploads = req.files['utb1_documents[]'] || [];

      //multer adds path, filename, originalname, size, mimetype
      // File details are now in arrays of objects
      const utb1UploadsDetails = utb1Uploads.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path
      }));

      // Log the extracted data (for demonstration)
    
      // 5. Database Insertion
      try {
        const insertQuery = `
            INSERT INTO utb1 (
                    c_id,
                    reinvestmentOpportunityComment, reinvestmentOpportunityQuestion,
                    competitive_advantage_comment, competitive_advantage_question,
                    market_share_comment, market_share_question,
                    inflation_proof_comment, inflation_proof_question,
                    imminent_factors_comment, imminent_factors_question,
                    cost_structure_comment, cost_structure_question,
                    shrinking_markets_comment, shrinking_markets_question,
                    market_perceptions_comment, market_perceptions_question,
                    operating_history_comment, operating_history_question,
                    long_term_prospects_comment, long_term_prospects_question,
                    understandable_business_comment, understandable_business_question,
                    evaluatable_characteristics_comment, evaluatable_characteristics_question,
                    market_potential_comment, market_potential_question,
                    research_development_comment, research_development_question,
                    sales_organization_comment, sales_organization_question,
                    labor_relations_comment, labor_relations_question,
                    executive_relations_comment, executive_relations_question,
                    industry_peculiarities_comment, industry_peculiarities_question,
                    profit_outlook_comment, profit_outlook_question,
                    fad_comment, fad_question,
                    cyclical_dependent_comment, cyclical_dependent_question,
                    net_cash_generator_comment, net_cash_generator_question,
                    economies_of_scale_scope_comment, economies_of_scale_scope_question,
                    network_effect_comment, network_effect_question,
                    intellectual_property_rights_comment, intellectual_property_rights_question,
                    high_switching_costs_comment, high_switching_costs_question,
                    oligopolist_market_comment, oligopolist_market_question ,utb1UploadsDetails
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56
            )
        `;

        const values = [
          c_id,
          reinvestmentOpportunityComment, reinvestmentOpportunityQuestion,
          competitiveAdvantageComment, competitiveAdvantageQuestion,
          marketShareComment, marketShareQuestion,
          inflationProofComment, inflationProofQuestion,
          imminentFactorsComment, imminentFactorsQuestion,
          costStructureComment, costStructureQuestion,
          shrinkingMarketsComment, shrinkingMarketsQuestion,
          marketPerceptionsComment, marketPerceptionsQuestion,
          operatingHistoryComment, operatingHistoryQuestion,
          longTermProspectsComment, longTermProspectsQuestion,
          understandableBusinessComment, understandableBusinessQuestion,
          evaluatableCharacteristicsComment, evaluatableCharacteristicsQuestion,
          marketPotentialComment, marketPotentialQuestion,
          researchDevelopmentComment, researchDevelopmentQuestion,
          salesOrganizationComment, salesOrganizationQuestion,
          laborRelationsComment, laborRelationsQuestion,
          executiveRelationsComment, executiveRelationsQuestion,
          industryPeculiaritiesComment, industryPeculiaritiesQuestion,
          profitOutlookComment, profitOutlookQuestion,
          fadComment, fadQuestion,
          cyclicalDependentComment, cyclicalDependentQuestion,
          netCashGeneratorComment, netCashGeneratorQuestion,
          economiesOfScaleScopeComment, economiesOfScaleScopeQuestion,
          networkEffectComment, networkEffectQuestion,
          intellectualPropertyRightsComment, intellectualPropertyRightsQuestion,
          highSwitchingCostsComment, highSwitchingCostsQuestion,
          oligopolistMarketComment, oligopolistMarketQuestion,
          JSON.stringify(utb1UploadsDetails)
        ];

        await db.query(insertQuery, values);
     // 4. Calculate the score
     let score = 0;
     const questions = [
         "reinvestment_opportunity_question", "competitive_advantage_question", "market_share_question",
         "inflation_proof_question", "imminent_factors_question", "cost_structure_question",
         "shrinking_markets_question", "market_perceptions_question", "operating_history_question",
         "long_term_prospects_question", "understandable_business_question", "evaluatable_characteristics_question",
         "market_potential_question", "research_development_question", "sales_organization_question",
         "labor_relations_question", "executive_relations_question", "industry_peculiarities_question",
         "profit_outlook_question", "fad_question", "cyclical_dependent_question",
         "net_cash_generator_question", "economies_of_scale_scope_question", "network_effect_question", "intellectual_property_rights_question", "high_switching_costs_question", "oligopolist_market_question"
     ];

     const questionValues = {
         reinvestment_opportunity_question: parseInt(reinvestmentOpportunityQuestion, 10),
         competitive_advantage_question: parseInt(competitiveAdvantageQuestion, 10),
         market_share_question: parseInt(marketShareQuestion, 10),
         inflation_proof_question: parseInt(inflationProofQuestion, 10),
         imminent_factors_question: parseInt(imminentFactorsQuestion, 10),
         cost_structure_question: parseInt(costStructureQuestion, 10),
         shrinking_markets_question: parseInt(shrinkingMarketsQuestion, 10),
         market_perceptions_question: parseInt(marketPerceptionsQuestion, 10),
         operating_history_question: parseInt(operatingHistoryQuestion, 10),
         long_term_prospects_question: parseInt(longTermProspectsQuestion, 10),
         understandable_business_question: parseInt(understandableBusinessQuestion, 10),
         evaluatable_characteristics_question: parseInt(evaluatableCharacteristicsQuestion, 10),
         market_potential_question: parseInt(marketPotentialQuestion, 10),
         research_development_question: parseInt(researchDevelopmentQuestion, 10),
         sales_organization_question: parseInt(salesOrganizationQuestion, 10),
         labor_relations_question: parseInt(laborRelationsQuestion, 10),
         executive_relations_question: parseInt(executiveRelationsQuestion, 10),
         industry_peculiarities_question: parseInt(industryPeculiaritiesQuestion, 10),
         profit_outlook_question: parseInt(profitOutlookQuestion, 10),
         fad_question: parseInt(fadQuestion, 10),
         cyclical_dependent_question: parseInt(cyclicalDependentQuestion, 10),
         net_cash_generator_question: parseInt(netCashGeneratorQuestion, 10),
         economies_of_scale_scope_question: parseInt(economiesOfScaleScopeQuestion, 10),
         network_effect_question: parseInt(networkEffectQuestion, 10),
         intellectual_property_rights_question: parseInt(intellectualPropertyRightsQuestion, 10),
         high_switching_costs_question: parseInt(highSwitchingCostsQuestion, 10),
         oligopolist_market_question: parseInt(oligopolistMarketQuestion, 10)
     };

     questions.forEach(questionKey => {
         const answerValue = questionValues[questionKey];
         if (!isNaN(answerValue)) {
             score += answerValue;
         }
     });

                const Creator = "admin";
                const DateM = new Date().toISOString();
                const Comp = "30";
                const Score =  score.toString();;// Convert the score to a string score.toString();
                const Status = "Assessment";
                const maxScore = "42";

                const updateCompanyQuery = `
                UPDATE companyinfo
                SET c_creator = $1, c_datem = $2, c_comp = $3, c_score = c_score + $4, c_status = $5, maximum_score = maximum_score + $6
                WHERE
                c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1);
              `;
              const updateValues = [Creator, DateM, Comp, Score, Status,maxScore];
              await db.query(updateCompanyQuery, updateValues);
            

    } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ message: 'Database operation failed.', error: dbError.message });
    }
} catch (error) {
    console.error('Error processing form data:', error);
    res.status(500).json({ message: 'An error occurred while processing the form data.', error: error.message });
}
    // 2. Retrieve the last inserted row
    const lastInserted = await db.query(
      `SELECT * FROM companyinfo ORDER BY c_datem DESC LIMIT 1`
    );

          // 3. Render the tracker.ejs template with the data
          const currentscore = await db.query(`
            SELECT c_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const maxScore = await db.query(`
            SELECT maximum_score
            FROM companyinfo
            WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
          `);
    
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10);
          const maxScoreInt = parseInt(maxScore.rows[0].maximum_score, 10);
    
          const percentage = Math.round(currentScoreInt / maxScoreInt * 100);
          console.log(percentage)
    
          res.render("utb2.ejs", { company: lastInserted.rows[0], score: percentage});
});

app.post('/submit', upload.fields([
    { name: '10q_upload[]', maxCount: 100 },
    { name: '10k_upload[]', maxCount: 100 },
    { name: 'proxies_upload[]', maxCount: 100 },
    { name: 'press_releases_upload[]', maxCount: 100 },
    { name: 'court_documents_upload[]', maxCount: 100 },
    { name: 'real_estate_records_upload[]', maxCount: 100 },
    { name: 'industry_publications_upload[]', maxCount: 100 },
    { name: 'sell_side_research_upload[]', maxCount: 100 },
    { name: 'court_cases_upload[]', maxCount: 100 },
    { name: 'business_model_canvas_document[]', maxCount: 100 },
    { name: 'bcg_matrix_document[]', maxCount: 100 },
    { name: 'pestel_analysis_document[]', maxCount: 100 },
    { name: 'porters_five_forces_document[]', maxCount: 100 },
    { name: 'swot_analysis_document[]', maxCount: 100 },
]), async (req, res) => {
        try {
          const getLatestCompanyQuery = `
          SELECT c_id
          FROM Companyinfo
          ORDER BY c_datem DESC
          LIMIT 1;
        `;
          const latestCompanyResult = await db.query(getLatestCompanyQuery);
          if (latestCompanyResult && latestCompanyResult.rows && latestCompanyResult.rows.length > 0) {
            console.log(latestCompanyResult.rows[0].c_id);
          } else {
            console.log("No company found");
            res.status(404).send("No company found");
          }
          const c_id = latestCompanyResult.rows[0].c_id
 

        // Get checkbox values
        const prayed = req.body.question1_prayed === '1';
        const tenQCheckbox = req.body['10q_checkbox'] === '1';
        const tenKCheckbox = req.body['10k_checkbox'] === '1';
        const proxiesCheckbox = req.body['proxies_checkbox'] === '1';
        const pressReleasesCheckbox = req.body['press_releases_checkbox'] === '1';
        const courtDocumentsCheckbox = req.body['court_documents_checkbox'] === '1';
        const realEstateRecordsCheckbox = req.body['real_estate_records_checkbox'] === '1';
        const industryPublicationsCheckbox = req.body['industry_publications_checkbox'] === '1';
        const sellSideResearchCheckbox = req.body['sell_side_research_checkbox'] === '1';
        const courtCasesCheckbox = req.body['court_cases_checkbox'] === '1';

        //Comments
        const businessModelCanvasComment = req.body.business_model_canvas_comment;
        const bcgMatrixComment = req.body.bcg_matrix_comment;
        const pestelAnalysisComment = req.body.pestel_analysis_comment;
        const portersFiveForcesComment = req.body.porters_five_forces_comment;
        const swotAnalysisComment = req.body.swot_analysis_comment;

        //Radio button
        const businessModelCanvasQuestion = req.body.business_model_canvas_question;
        const bcgMatrixQuestion = req.body.bcg_matrix_question;
        const pestelAnalysisQuestion = req.body.pestel_analysis_question;
        const portersFiveForcesQuestion = req.body.porters_five_forces_question;
        const swotAnalysisQuestion = req.body.swot_analysis_question;


        // Get uploaded files - Use req.files, not req.body for files
        const tenQUploads = req.files['10q_upload[]'] || [];
        const tenKUploads = req.files['10k_upload[]'] || [];
        const proxiesUploads = req.files['proxies_upload[]'] || [];
        const pressReleasesUploads = req.files['press_releases_upload[]'] || [];
        const courtDocumentsUploads = req.files['court_documents_upload[]'] || [];
        const realEstateRecordsUploads = req.files['real_estate_records_upload[]'] || [];
        const industryPublicationsUploads = req.files['industry_publications_upload[]'] || [];
        const sellSideResearchUploads = req.files['sell_side_research_upload[]'] || [];
        const courtCasesUploads = req.files['court_cases_upload[]'] || [];
        const businessModelCanvasDoc = req.files['business_model_canvas_document[]'] || [];
        const bcgMatrixDoc = req.files['bcg_matrix_document[]'] || [];
        const pestelAnalysisDoc = req.files['pestel_analysis_document[]'] || [];
        const portersFiveForcesDoc = req.files['porters_five_forces_document[]'] || [];
        const swotAnalysisDoc = req.files['swot_analysis_document[]'] || [];

        //multer adds path, filename, originalname, size, mimetype
        // File details are now in arrays of objects
        const tenQUploadDetails = tenQUploads.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            path: file.path
        }));

        const tenKUploadDetails = tenKUploads.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            path: file.path
        }));
        const proxiesUploadDetails = proxiesUploads.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            path: file.path
        }));
        const pressReleasesUploadDetails = pressReleasesUploads.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            path: file.path
        }));
        const courtDocumentsUploadDetails = courtDocumentsUploads.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            path: file.path
        }));
        const realEstateRecordsUploadDetails = realEstateRecordsUploads.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            path: file.path
        }));
        const industryPublicationsUploadDetails = industryPublicationsUploads.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            path: file.path
        }));
        const sellSideResearchUploadDetails = sellSideResearchUploads.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            path: file.path
        }));
        const courtCasesUploadDetails = courtCasesUploads.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            path: file.path
        }));

        const businessModelCanvasDocDetails = businessModelCanvasDoc.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path
      }));


        const bcgMatrixDocDetails = bcgMatrixDoc.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path
      }));

        const pestelAnalysisDocDetails = pestelAnalysisDoc.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path
      }));

        const portersFiveForcesDocDetails = portersFiveForcesDoc.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path
      }));

        const swotAnalysisDocDetails = swotAnalysisDoc.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path
      }));
        // Log the extracted data (for demonstration)

        console.log('Checkboxes:', {
            c_id, prayed, tenQCheckbox, tenKCheckbox, proxiesCheckbox, pressReleasesCheckbox, courtDocumentsCheckbox, realEstateRecordsCheckbox, industryPublicationsCheckbox, sellSideResearchCheckbox, courtCasesCheckbox
        });
        console.log("Radio Buttons", {
            businessModelCanvasQuestion, bcgMatrixQuestion, pestelAnalysisQuestion, portersFiveForcesQuestion, swotAnalysisQuestion
        });

        console.log('Uploaded Files (10Q):', tenQUploadDetails);
        console.log('Uploaded Files (10K):', tenKUploadDetails);
        console.log('Uploaded Files (Proxies):', proxiesUploadDetails);
        console.log('Uploaded Files (Press Releases):', pressReleasesUploadDetails);
        console.log('Uploaded Files (Court Documents):', courtDocumentsUploadDetails);
        console.log('Uploaded Files (Real Estate):', realEstateRecordsUploadDetails);
        console.log('Uploaded Files (Industry Publications):', industryPublicationsUploadDetails);
        console.log('Uploaded Files (Sell-Side Research):', sellSideResearchUploadDetails);
        console.log('Uploaded Files (Court Cases):', courtCasesUploadDetails);
        console.log('Uploaded File (Business Model Canvas):', businessModelCanvasDocDetails);
        console.log('Uploaded File (BCG Matrix):', bcgMatrixDocDetails);
        console.log('Uploaded File (PESTEL):', pestelAnalysisDocDetails);
        console.log('Uploaded File (Porters Five Forces):', portersFiveForcesDocDetails);
        console.log('Uploaded File (SWOT):', swotAnalysisDocDetails);

        // Database insertion
        // 5. Database Insertion
        try {
          const insertQuery = `
              INSERT INTO uploads (
                  c_id,
                  prayed,
                  tenQCheckbox,
                  tenKCheckbox,
                  proxiesCheckbox,
                  pressReleasesCheckbox,
                  courtDocumentsCheckbox,
                  realEstateRecordsCheckbox,
                  industryPublicationsCheckbox,
                  sellSideResearchCheckbox,
                  courtCasesCheckbox,
                  businessModelCanvasQuestion,
                  bcgMatrixQuestion,
                  pestelAnalysisQuestion,
                  portersFiveForcesQuestion,
                  swotAnalysisQuestion,
                  tenQUploadDetails,
                  tenKUploadDetails,
                  proxiesUploadDetails,
                  pressReleasesUploadDetails,
                  courtDocumentsUploadDetails,
                  realEstateRecordsUploadDetails,
                  industryPublicationsUploadDetails,
                  sellSideResearchUploadDetails,
                  courtCasesUploadDetails,
                  businessModelCanvasDocDetails,
                  bcgMatrixDocDetails,
                  pestelAnalysisDocDetails,
                  portersFiveForcesDocDetails,
                  swotAnalysisDocDetails,
                  businessModelCanvasComment,
                  bcgMatrixComment,
                  pestelAnalysisComment,
                  portersFiveForcesComment,
                  swotAnalysisComment
              ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                  $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                  $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                  $31, $32, $33, $34, $35
              )
          `;

          const values = [
              c_id,
              prayed,
              tenQCheckbox,
              tenKCheckbox,
              proxiesCheckbox,
              pressReleasesCheckbox,
              courtDocumentsCheckbox,
              realEstateRecordsCheckbox,
              industryPublicationsCheckbox,
              sellSideResearchCheckbox,
              courtCasesCheckbox,
              businessModelCanvasQuestion,
              bcgMatrixQuestion,
              pestelAnalysisQuestion,
              portersFiveForcesQuestion,
              swotAnalysisQuestion,
              JSON.stringify(tenQUploadDetails),
              JSON.stringify(tenKUploadDetails),
              JSON.stringify(proxiesUploadDetails),
              JSON.stringify(pressReleasesUploadDetails),
              JSON.stringify(courtDocumentsUploadDetails),
              JSON.stringify(realEstateRecordsUploadDetails),
              JSON.stringify(industryPublicationsUploadDetails),
              JSON.stringify(sellSideResearchUploadDetails),
              JSON.stringify(courtCasesUploadDetails),
              JSON.stringify(businessModelCanvasDocDetails),
              JSON.stringify(bcgMatrixDocDetails),
              JSON.stringify(pestelAnalysisDocDetails),
              JSON.stringify(portersFiveForcesDocDetails),
              JSON.stringify(swotAnalysisDocDetails),
              businessModelCanvasComment,
              bcgMatrixComment,
              pestelAnalysisComment,
              portersFiveForcesComment,
              swotAnalysisComment,
          ];

          await db.query(insertQuery, values);
                  // Calculate the score
                  let score = 0;
                  score += parseInt(businessModelCanvasQuestion) || 0;
                  score += parseInt(bcgMatrixQuestion) || 0;
                  score += parseInt(pestelAnalysisQuestion) || 0;
                  score += parseInt(portersFiveForcesQuestion) || 0;
                  score += parseInt(swotAnalysisQuestion) || 0;

                  const Creator = "admin";
                  const DateM = new Date().toISOString();
                  const Comp = "23";
                  const Score = score.toString(); // Convert the score to a string
                  const Status = "Assessment";
                  const maxScore = 25
       
                  const updateCompanyQuery = `
                  UPDATE companyinfo
                  SET c_creator = $1, c_datem = $2, c_comp = $3, c_score = $4, c_status = $5, maximum_score = $6
                  WHERE
                  c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1);
                `;
                const updateValues = [Creator, DateM, Comp, Score, Status, maxScore];
                await db.query(updateCompanyQuery, updateValues);

      } catch (dbError) {
          console.error("Database error:", dbError);
          return res.status(500).json({ message: 'Database operation failed.', error: dbError.message });
      }
  } catch (error) {
      console.error('Error processing form data:', error);
      res.status(500).json({ message: 'An error occurred while processing the form data.', error: error.message });
  }
      // 2. Retrieve the last inserted row
      const lastInserted = await db.query(
        `SELECT * FROM companyinfo ORDER BY c_datem DESC LIMIT 1`
      );
  
      // 3. Render the tracker.ejs template with the data
      const currentscore = await db.query(`
        SELECT c_score
        FROM companyinfo
        WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
      `);

      const maxScore = await db.query(`
        SELECT maximum_score
        FROM companyinfo
        WHERE c_id = (SELECT c_id FROM companyinfo ORDER BY c_datem DESC LIMIT 1)
      `);

      const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10);
      const maxScoreInt = parseInt(maxScore.rows[0].maximum_score, 10);

      const percentage = Math.round(currentScoreInt / maxScoreInt * 100);
      console.log(percentage)

      res.render("utb1.ejs", { company: lastInserted.rows[0], score: percentage});
});

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/ACR",
  passport.authenticate("google", {
    successRedirect: "/center",
    failureRedirect: "/login",
  })
);

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      //hashing the password and saving it in the database
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            if (err) {
              console.error("Error logging in after registration:", err);
              res.send("Error logging in after registration");
            } else {
              res.render("login.ejs");
    
            }
          }
          );
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

passport.use("local",
  new Strategy(async function (username, password, cb) {
  const email = username;
  const loginPassword = password;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedHashedPassword = user.password;
      bcrypt.compare(loginPassword, storedHashedPassword, (err, result) => {
        if (err) {
          return
        } else {
          if (result) {
            return cb(null, user);
          } else {
            return cb(null, false, { message: "Incorrect Password" });
          }
        }
      });
    } else {
      return cb(null, false, { message: "User not found" });
    }
  } catch (err) {
    return cb(err);
  }

}));

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/ACR",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.serializeUser(function (user, cb) {
  cb(null, user.id);
}
);

passport.deserializeUser(async function (id, cb) {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      cb(null, result.rows[0]);
    } else {
      cb(new Error("User not found"));
    }
  } catch (err) {
    cb(err);
  }
}
);

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/center",
    failureRedirect: "/login",
  })
);

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error logging out:", err);
    } else {
      res.redirect("/");
    }
  });
}
);

app.get("/center", async (req, res) => {
  if (req.isAuthenticated()) {
    const allCompaniesOrdered = await db.query(
      `SELECT * FROM companyinfo ORDER BY c_datem DESC`
    );
    res.render("index.ejs", { companies: allCompaniesOrdered.rows });  
  }
  else {
    res.redirect("/login");
  }
}
);


app.post("/add", async (req, res) => {
    res.render("new.ejs", { countries, currencies });
});

app.post("/companies", async (req, res) => {
  const { companyName, website, ceo, chairman, country, Currency, description, employees, interest, address, tickerSymbol, ipo, Incorporation, exchange, sector, subSector } = req.body;
  const Creator = "admin";
  const DateM = new Date().toISOString();
  const Comp = "10";
  const Score = "0";
  const Status = "Assessment";

  try {
    // 1. Insert the new company data
    await db.query(
      `INSERT INTO companyinfo (
        c_name, c_creator, c_datem, c_comp, c_score, c_status, 
        c_website, c_ceo, c_chair, c_description, c_employees, 
        c_address, c_interest, c_ticker, c_ipo, c_incorporation, 
        c_currency, c_exchange, c_country, c_sector, c_sub
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 
        $7, $8, $9, $10, $11, 
        $12, $13, $14, $15, $16, 
        $17, $18, $19, $20, $21
      )`,
      [
        companyName, Creator, DateM, Comp, Score, Status,
        website, ceo, chairman, description, employees,
        address, interest, tickerSymbol, ipo, Incorporation,
        Currency, exchange, country, sector, subSector
      ]
    );

    // 2. Retrieve the last inserted row
    const lastInserted = await db.query(
      `SELECT * FROM companyinfo ORDER BY c_id DESC LIMIT 1`
    );

    // 3. Render the tracker.ejs template with the data
    res.render("background.ejs", { company: lastInserted.rows[0] });


  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving and displaying company data.");
  }
});

app.get('/get-progress', async (req, res) => {
  try {
    const result = await db.query('SELECT c_comp FROM companyinfo ORDER BY c_datem DESC LIMIT 1');

    if (result.rows.length > 0) {
      const progressValue = result.rows[0].c_comp;

      // Validate that c_comp is a number and within 0-100 range.
      if (typeof progressValue === 'number' && progressValue >= 0 && progressValue <= 100) {
        res.json({ progress: progressValue });
      } else {
        console.error("Invalid progress value in database:", progressValue);
        res.status(500).json({ error: "Invalid progress value in database." });
      }

    } else {
      res.status(404).json({ error: 'No company data found.' });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error.' });
  }
});

app.post('/continue', async (req, res) => {
  try {
    const companyId = req.body.companyId;
    // Get the latest company progress
    const result = await db.query('SELECT c_comp FROM companyinfo WHERE c_id = $1', [companyId]);
    // Update the current c_datem for the companyId
    await db.query('UPDATE companyinfo SET c_datem = $1 WHERE c_id = $2', [new Date().toISOString(), companyId]);

    if (result.rows.length > 0) {
      const { c_comp } = result.rows[0];

      // Redirect based on progress or status
      if (c_comp === 10) {
        const lastInserted = await db.query(
          `SELECT * FROM companyinfo WHERE c_id = $1`, [companyId]);
        // Render the tracker.ejs template with the data
        const currentscore = await db.query(`SELECT c_score FROM companyinfo WHERE c_id = $1`, [companyId]);
        const maximum_score = await db.query(`SELECT maximum_score FROM companyinfo WHERE c_id = $1`, [companyId]);
        const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10) / parseInt(maximum_score.rows[0].maximum_score, 10) * 100; 
        res.render("background.ejs", { company: lastInserted.rows[0], score: currentScoreInt });
      } else if (c_comp > 10 && c_comp <= 23) {
        const lastInserted = await db.query(
          `SELECT * FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentscore = await db.query(`SELECT c_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const maximum_score = await db.query(`SELECT maximum_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10) / parseInt(maximum_score.rows[0].maximum_score, 10) * 100; 
          res.render("utb1.ejs", { company: lastInserted.rows[0], score: currentScoreInt });
      } else if (c_comp > 23 && c_comp <= 30) {
        const lastInserted = await db.query(
          `SELECT * FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentscore = await db.query(`SELECT c_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const maximum_score = await db.query(`SELECT maximum_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10) / parseInt(maximum_score.rows[0].maximum_score, 10) * 100; 
          res.render("utb2.ejs", { company: lastInserted.rows[0], score: currentScoreInt });
      } else if (c_comp > 30 && c_comp <= 35) {
        const lastInserted = await db.query(
          `SELECT * FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentscore = await db.query(`SELECT c_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const maximum_score = await db.query(`SELECT maximum_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10) / parseInt(maximum_score.rows[0].maximum_score, 10) * 100; 
          res.render("ma1.ejs", { company: lastInserted.rows[0], score: currentScoreInt });
      } else if (c_comp >= 35 && c_comp < 50) {
        const lastInserted = await db.query(
          `SELECT * FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentscore = await db.query(`SELECT c_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const maximum_score = await db.query(`SELECT maximum_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10) / parseInt(maximum_score.rows[0].maximum_score, 10) * 100; 
          res.render("utf2.ejs", { company: lastInserted.rows[0], score: currentScoreInt });
      } else if (c_comp >= 50 && c_comp < 57) {
        const lastInserted = await db.query(
          `SELECT * FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentscore = await db.query(`SELECT c_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const maximum_score = await db.query(`SELECT maximum_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10) / parseInt(maximum_score.rows[0].maximum_score, 10) * 100; 
          res.render("utf2.ejs", { company: lastInserted.rows[0], score: currentScoreInt });
      } else if (c_comp >= 57 && c_comp < 70) {
        const lastInserted = await db.query(
          `SELECT * FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentscore = await db.query(`SELECT c_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const maximum_score = await db.query(`SELECT maximum_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10) / parseInt(maximum_score.rows[0].maximum_score, 10) * 100; 
          res.render("vl1.ejs", { company: lastInserted.rows[0], score: currentScoreInt });
      } else if (c_comp >= 70 && c_comp < 80) {
        const lastInserted = await db.query(
          `SELECT * FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentscore = await db.query(`SELECT c_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const maximum_score = await db.query(`SELECT maximum_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10) / parseInt(maximum_score.rows[0].maximum_score, 10) * 100; 
          res.render("vl2.ejs", { company: lastInserted.rows[0], score: currentScoreInt });
      } else if (c_comp >= 80 && c_comp < 100) {
        const lastInserted = await db.query(
          `SELECT * FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentscore = await db.query(`SELECT c_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const maximum_score = await db.query(`SELECT maximum_score FROM companyinfo WHERE c_id = $1`, [companyId]);
          const currentScoreInt = parseInt(currentscore.rows[0].c_score, 10) / parseInt(maximum_score.rows[0].maximum_score, 10) * 100; 
          res.render("final.ejs", { company: lastInserted.rows[0], score: currentScoreInt });
      } else if (c_comp > 100) {
        res.redirect('/final.ejs'); // change to review and edit page
      } else {
        res.redirect('/'); // Redirect to the home page if completed
      }
    } else {
      res.redirect('/'); // Redirect to home if no progress is found
    }
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).send('Error determining progress.');
  }
});


app.listen(port, () => {
  console.log(`Server running aokay on port ${port}`);
});


