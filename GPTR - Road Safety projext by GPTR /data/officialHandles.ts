
// DATABASE OF OFFICIAL HANDLES FOR ROAD SAFETY ESCALATION
// Source: Community & Official Government Directories

export interface RegionHandles {
    cm: string; // Used for CM or Lt. Governor/Administrator
    deputy_cm?: string;
    road_dept: string;
    cities?: Record<string, string>;
}

export const OFFICIAL_HANDLES: Record<string, Record<string, RegionHandles>> = {
    "India": {
        // --- STATES ---
        "Andhra Pradesh": {
            "cm": "@ncbn @AndhraPradeshCM",
            "deputy_cm": "@PawanKalyan",
            "road_dept": "@AP_Roads @aprtsofficial",
            "cities": {
                "Visakhapatnam": "@GVMC_VISAKHA",
                "Vijayawada": "@ourvmc",
                "Tirupati": "@MCT_Tirupati",
                "Vizianagaram": "@VZM_Collector @VizianagaramMun"
            }
        },
        "Telangana": {
            "cm": "@revanth_anumula @TelanganaCMO",
            "deputy_cm": "@Bhatti_Vikramarka",
            "road_dept": "@TelanganaRandB @TGRTAIndia",
            "cities": {
                "Hyderabad": "@GHMCOnline @CommissionrGHMC",
                "Warangal": "@GWMC_Official"
            }
        },
        "Tamil Nadu": {
            "cm": "@mkstalin @CMOTamilNadu",
            "road_dept": "@tnhighways @evvelu",
            "cities": {
                "Chennai": "@chennaicorp",
                "Coimbatore": "@CoimbatoreCorp",
                "Trichy": "@TrichyCorp",
                "Madurai": "@mducorp"
            }
        },
        "Karnataka": {
            "cm": "@siddaramaiah @CMofKarnataka",
            "deputy_cm": "@DKShivakumar",
            "road_dept": "@KPWDGoK @KARTRANSPORTDEPT",
            "cities": {
                "Bengaluru": "@BBMPIOfficial",
                "Hubballi": "@HdmcHubliDwd",
                "Mangaluru": "@MangaluruCorp"
            }
        },
        "Maharashtra": {
            "cm": "@mieknathshinde @CMOMaharashtra",
            "deputy_cm": "@Dev_Fadnavis @AjitPawarSpeaks",
            "road_dept": "@mahapwdofficial @MAHAPWD",
            "cities": {
                "Mumbai": "@mybmc @mybmcwardKW",
                "Pune": "@PMCPune",
                "Nagpur": "@ngpnmc",
                "Thane": "@TMCaTweetAway",
                "Navi Mumbai": "@NMMConline",
                "Nashik": "@NashikCorp",
                "Solapur": "@smcsolapur",
                "Kalyan": "@KDMCOfficial",
                "Vasai-Virar": "@vvcmc_official",
                "Pimpri-Chinchwad": "@PCMCSarathi"
            }
        },
        "Gujarat": {
            "cm": "@Bhupendrapbjp @CMOGuj",
            "road_dept": "@GujRnbDept",
            "cities": {
                "Ahmedabad": "@AmdavadAMC",
                "Surat": "@MySuratMySMC",
                "Vadodara": "@VMCVadodara",
                "Rajkot": "@RMC_Rajkot"
            }
        },
        "Uttar Pradesh": {
            "cm": "@myogiadityanath @CMOfficeUP",
            "road_dept": "@uppwdofficial @UPPWDGOV",
            "cities": {
                "Lucknow": "@LucknowMC",
                "Kanpur": "@nagarnigamknp",
                "Varanasi": "@nagarnigamvns",
                "Meerut": "@MrtNagarNigam",
                "Ghaziabad": "@GhzNagarNigam",
                "Agra": "@AgraNagarNigam"
            }
        },
        "Madhya Pradesh": {
            "cm": "@DrMohanYadav51 @CMMadhyaPradesh",
            "road_dept": "@pwdminmp @OFCRakeshSingh",
            "cities": {
                "Bhopal": "@BMCBhopal",
                "Indore": "@IMCIndore",
                "Gwalior": "@smartgwalior"
            }
        },
        "West Bengal": {
            "cm": "@MamataOfficial @EGiyeBangla",
            "road_dept": "@wbpwdgovin @wbpwd",
            "cities": {
                "Kolkata": "@kmc_kolkata",
                "Howrah": "@HowrahMunicipal"
            }
        },
        "Odisha": {
            "cm": "@MohanMajhi_BJP @CMO_Odisha",
            "road_dept": "@PWD_Odisha @RD_Odisha",
            "cities": {
                "Bhubaneswar": "@bmcbbsr",
                "Cuttack": "@CMCCuttack"
            }
        },
        "Kerala": {
            "cm": "@pinarayivijayan @CMOKerala",
            "road_dept": "@Kerala_PWD",
            "cities": {
                "Thiruvananthapuram": "@TrivandrumCorp",
                "Kochi": "@KochiCorporation"
            }
        },
        "Bihar": {
            "cm": "@NitishKumar @CMOBihar",
            "deputy_cm": "@samrat4bihar",
            "road_dept": "@BiharRCD",
            "cities": {
                "Patna": "@PMCBihar"
            }
        },
        "Rajasthan": {
            "cm": "@BhajanlalBjp @RajCMO",
            "road_dept": "@PwdRajasthan",
            "cities": {
                "Jaipur": "@Jaipur_Nagar",
                "Udaipur": "@Udaipur_Nagar"
            }
        },
        "Punjab": {
            "cm": "@BhagwantMann @CMOPb",
            "road_dept": "@PWD_Punjab",
            "cities": {
                "Ludhiana": "@MCLudhiana",
                "Amritsar": "@MCAmritsar"
            }
        },
        "Haryana": {
            "cm": "@NayabSainiBJP @cmohry",
            "road_dept": "@HaryanaPwd",
            "cities": {
                "Gurugram": "@mcgurgaon",
                "Faridabad": "@MCF_Faridabad"
            }
        },
        "Assam": {
            "cm": "@himantabiswa @CMOfficeAssam",
            "road_dept": "@AssamPWD",
            "cities": {
                "Guwahati": "@GuwahatiMC"
            }
        },
        "Chhattisgarh": {
            "cm": "@vishnudsai @ChhattisgarhCMO",
            "road_dept": "@ChhattisgarhPWD",
            "cities": {
                "Raipur": "@MuncipalRaipur"
            }
        },
        "Jharkhand": {
            "cm": "@HemantSorenJMM @JharkhandCMO",
            "road_dept": "@JharkhandPWD",
            "cities": {
                "Dhanbad": "@SwachhDhanbad",
                "Ranchi": "@RanchiCorp"
            }
        },
        "Himachal Pradesh": {
            "cm": "@SukhuSukhvinder @CMOFFICEHP",
            "road_dept": "@HimachalPWD",
            "cities": {
                "Shimla": "@Shimla_MC"
            }
        },
        "Uttarakhand": {
            "cm": "@pushkardhami @ukcmo",
            "road_dept": "@UttarakhandPWD",
            "cities": {
                "Dehradun": "@DdnNagarnigam"
            }
        },
        "Goa": {
            "cm": "@DrPramodPSawant @GoaCMO",
            "road_dept": "@GoaPWD"
        },
        "Tripura": {
            "cm": "@DrManikSaha2",
            "road_dept": "@TripuraPWD"
        },
        "Arunachal Pradesh": {
            "cm": "@PemaKhanduBJP @ArunachalCMO",
            "road_dept": "@ArunachalPWD"
        },
        "Manipur": {
            "cm": "@NBirenSingh",
            "road_dept": "@ManipurPWD"
        },
        "Meghalaya": {
            "cm": "@SangmaConrad",
            "road_dept": "@MeghalayaPWD"
        },
        "Mizoram": {
            "cm": "@Lal_Duhoma",
            "road_dept": "@MizoramPWD"
        },
        "Nagaland": {
            "cm": "@Neiphiu_Rio",
            "road_dept": "@NagalandPWD"
        },
        "Sikkim": {
            "cm": "@PSTamangGolay",
            "road_dept": "@SikkimPWD"
        },

        // --- UNION TERRITORIES (Mapped Admins to CM field) ---
        "Delhi": {
            "cm": "@AtishiAAP @CMODelhi",
            "road_dept": "@DelhiPWD",
            "cities": {
                "Delhi": "@MCD_Delhi"
            }
        },
        "Chandigarh": {
            "cm": "@RajBhavanPb", // Administrator
            "road_dept": "@ChandigarhPWD",
            "cities": {
                "Chandigarh": "@MCChandigarh"
            }
        },
        "Jammu and Kashmir": {
            "cm": "@OmarAbdullah @CMO_JK",
            "road_dept": "@JK_PWDRMB",
            "cities": {
                "Jammu": "@jmcjammu",
                "Srinagar": "@SMC_Srinagar"
            }
        },
        "Puducherry": {
            "cm": "@NRangasamypdy",
            "road_dept": "@PuducherryPWD"
        },
        "Ladakh": {
            "cm": "@lg_ladakh", // Lt Governor
            "road_dept": "@LadakhPWD"
        },
        "Andaman and Nicobar": {
            "cm": "@lg_andaman", // Lt Governor
            "road_dept": "@AndamanPWD"
        },
        "Lakshadweep": {
            "cm": "@prafulkpatel", // Administrator
            "road_dept": "@LakshadweepPWD"
        }
    },
    
    "USA": {
        "California": {
            "cm": "@GavinNewsom",
            "deputy_cm": "@EleniForCA",
            "road_dept": "@CaltransHQ",
            "cities": {
                "San Francisco": "@sf311 @LondonBreed",
                "San Jose": "@SanJoseDOT @sliccardo",
                "Los Angeles": "@LADOOT @MayorOfLA",
                "Mountain View": "@mountainviewgov",
                "Sunnyvale": "@CityofSunnyvale"
            }
        },
        "New York": {
            "cm": "@GovKathyHochul",
            "deputy_cm": "@AntonioDelgado",
            "road_dept": "@NYSDOT",
            "cities": {
                "New York City": "@nyc311 @NYCDOT",
                "Buffalo": "@Buffalo311"
            }
        },
        "Texas": {
            "cm": "@GregAbbott_TX",
            "deputy_cm": "@DanPatrick",
            "road_dept": "@TxDOT",
            "cities": {
                "Austin": "@austin311 @austinmobility",
                "Dallas": "@Dallas311 @CityOfDallas",
                "Houston": "@HoustonTX311",
                "San Antonio": "@COSAGOV"
            }
        },
        "Washington": {
            "cm": "@GovInslee",
            "deputy_cm": "@LtGovDennyHeck",
            "road_dept": "@wsdot",
            "cities": {
                "Seattle": "@seattledot @CityofSeattle @SeattleCouncil",
                "Bellevue": "@BellevueWADOT"
            }
        },
        "Florida": {
            "cm": "@GovRonDeSantis",
            "deputy_cm": "@JeanetteNunez",
            "road_dept": "@MyFDOT",
            "cities": {
                "Miami": "@MiamiDade311",
                "Orlando": "@citybeautiful"
            }
        },
        "Illinois": {
            "cm": "@GovPritzker",
            "deputy_cm": "@JulianaStratton",
            "road_dept": "@IDOT_Illinois",
            "cities": {
                "Chicago": "@chicago311 @CDOT"
            }
        },
        "Massachusetts": {
            "cm": "@MassGovernor",
            "deputy_cm": "@MassLtGov",
            "road_dept": "@MassDOT",
            "cities": {
                "Boston": "@BOS311 @CityOfBoston"
            }
        },
        "Pennsylvania": {
            "cm": "@GovernorShapiro",
            "deputy_cm": "@RepAustinDavis",
            "road_dept": "@PennDOTNews",
            "cities": {
                "Philadelphia": "@Philly311",
                "Pittsburgh": "@Pgh311"
            }
        },
        "Georgia": {
            "cm": "@GovKemp",
            "deputy_cm": "@GeoffDuncanGA",
            "road_dept": "@GADeptofTrans",
            "cities": {
                "Atlanta": "@ATL311 @ATLDOT"
            }
        },
        "Michigan": {
            "cm": "@GovWhitmer",
            "deputy_cm": "@LtGovGilchrist",
            "road_dept": "@MichiganDOT",
            "cities": {
                "Detroit": "@DetroitCityGov"
            }
        },
        "Federal": {
             "cm": "@SecretaryPete", // Mapping Secretary to CM slot for logic compatibility
             "road_dept": "@USDOT"
        }
    }
};
