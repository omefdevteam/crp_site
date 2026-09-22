import type { PosterKind } from "@/lib/content";
import type { PinGroup } from "@/lib/pins";
import type { Locale } from "@/lib/locale";

const en = {
  a11y: {
    changeLanguage: "Change language, {language} selected",
    languageNames: { en: "English", fr: "French" },
    openMenu: "Open menu",
    closeMenu: "Close menu",
    playHome: "Play Home series",
    joinWaitlist: "Join the waitlist",
    email: "Email address",
    emailInvalid: "Enter a valid email",
    partnerUp: "Partner up",
    getInvolvedJump: "Get involved — open Get involved options",
    closeGetInvolved: "Close Get involved",
    closeApplicationProcess: "Close application process",
    closeAboutProgram: "Close about the program",
    back: "Back",
    backHome: "Back to home",
    discord: "Join our Discord",
    toggleAbout: "Toggle about the program",
    prevTestimonial: "Previous testimonial",
    nextTestimonial: "Next testimonial",
    platformGroups: "Platform groups",
    youthAmbassadorCard: "Nominate someone for the Youth Ambassador Program, ages 19-26",
    programDetails: "Program details for ages 19-26",
    moreComingSoon: "More coming soon",
    expressInterest: "Express interest",
    closeExpressInterest: "Close express interest",
    submitInterest: "Submit interest",
  },
  nav: {
    about: "About",
    involved: "Get involved",
    contact: "Contact",
  },
  aboutUs: {
    heroTitle: "About us",
    heroBody:
      "We build Climate Mobility Literacy by gathering local knowledge, amplifying lived experience, and bringing people together to understand what climate mobility means in different places.",
    statement:
      "The Climate Refugee Pavilion serves as a dedicated platform at COP30 to center human mobility within climate negotiations and amplify the voices of communities directly impacted by climate-induced displacement",
    statementTag: "We make climate mobility impossible to ignore",
    whatTitle: "What we do",
    whatBody:
      "Since 2020, we've worked on the ground in Zimbabwe, Mozambique and South Africa, supporting climate affected people and working with institutions. We learned that the word “refugee” is contentious, so we doubled down, and are now building an engine to increase global understanding of climate mobility .",
    cards: [
      {
        title: "Connecting people",
        body: "We explore ways to foster positive change",
      },
      {
        title: "Telling stories",
        body: "Our mission aims to create a meaningful impact",
      },
      {
        title: "Drive change",
        body: "We strive to make a difference through affirmative action",
      },
    ],
    teamTitle: "Team",
    teamQuote:
      "“The program amplifies young climate activists' voices, providing tools for advocacy at COP31”",
    memberName: "Jane Doe",
    memberRole: "Manager",
    involvedTitle: "Get involved",
    youthDates: "Nov 9-20",
    youthTitle: "Fully sponsored youth program in Turkey",
    partnerTitle: "Partner up",
  },
  partnerPage: {
    heroTitle: "Partner with us",
    heroBody: "Support the whole organization",
    reachOut: "Reach out",
    ambassador: "Support an ambassador program",
    storyline: "Support a specific storyline",
    speaker: "Apply as a speaker",
  },
  contactPage: {
    title: "Contact us",
    email: "email@gmail.com",
    address: "Office address",
    phone: "Phone",
    name: "*Name",
    organization: "Organization",
    emailField: "*Email",
    mobile: "*Mobile",
    message: "Write your message here",
    send: "Send",
  },
  hero: {
    line1Before: "Climate change moves people ",
    line1Accent: "differently",
    line1After: " in different places",
    line2: "Climate refugees are not legally recognized",
    photoAlt: "People talking together at an indoor pavilion gathering",
  },
  heroExtension: {
    title: "We're building a way to find the signal through the noise",
    subtitle: "Turning local insights into global action",
    photoAlt: "People and dogs walking across an open field at dusk",
  },
  pavilion: {
    location: "COP31, Antalya & online",
    headline:
      "Join people coming together to understand climate mobility and shape solutions",
    bringing: "Bringing",
    together: "together",
    photoAlt: "Aerial view of the COP31 pavilion grounds in Antalya",
    groups: [
      "communities",
      "Indigenous people",
      "scientists",
      "ngos",
      "youth",
      "governments",
      "engineers",
      "entrepreneurs",
    ],
  },
  platform: {
    subtitle:
      "Collecting insights from communities, experts and decision-makers around the world",
    comingSoon: "Coming soon",
    groups: {
      beacons: {
        label: "Beacons",
        blurb:
          "Connecting communities as beacons, illuminating pathways for collaboration",
      },
      missions: {
        label: "Missions",
        blurb: "Missions are activities that beacons report that require action",
      },
      ambassadors: {
        label: "Ambassadors",
        blurb:
          "Participants who complete our programs become our ambassadors.",
      },
    } satisfies Record<PinGroup, { label: string; blurb: string }>,
  },
  content: {
    kicker: "Our",
    subtitle:
      "Stories and knowledge that make the issue of climate mobility easier to understand",
    homeCaption:
      "H.O.M.E is a series of developing stories covering climate mobility across the globe",
    featuredAlt: "Friends gathered together",
    comingSoon: "Coming soon",
    topics: {
      phone: "Technology",
      getup: "Accessibility",
      wish: "Reflection & Prediction",
      chicken: "Adaption",
      taste: "Nutrition & Health",
      cash: "Finance",
    } satisfies Record<PosterKind, string>,
  },
  involved: {
    title: "Get involved",
    tab: "Get involved",
    youth: "Youth Ambassador Program",
    youthAlt: "Group of smiling young people",
    nominate: "Nominate",
    apply: "Apply",
    partner: "Partner up",
    dates: "Nov 9-20",
    programDates: "Oct 14 - Nov 16",
  },
  waitlist: {
    title: "Join the waitlist",
    emailPlaceholder: "Email",
    allSet: "All set",
    checkEmail: "Check your email for updates",
    photoAlt: "Sunlight and mist over a garden",
  },
  sponsors: {
    ticker: "Making climate mobility impossible to ignore",
    title: "Our partners",
    logosAlt: "ESG News and MEF",
  },
  footer: {
    copyright: "© {year} Climate Refugee Pavilion. All rights reserved.",
    columns: [
      { title: "Programs", links: ["Stories", "Sponsors", "Partners"] },
      { title: "Solidarity", links: ["Ambassadors", "Beacons", "Advocacy"] },
      { title: "Legal", links: ["Privacy", "Terms", "Mission"] },
    ],
  },
  programs: {
    title: "19-26\nYouth Ambassador Program",
    about: {
      dates: "Oct 14 - Nov 16",
      location: "COP31, Antalya, Türkiye",
      lede: "You'll spend a week inside the room where climate decisions get made - not on the sidelines, but shaping the pavilion itself.",
      body: [
        "This program starts from one truth: migration is how people have survived crisis for generations, and if you're one of the millions displaced by a changing climate, you're not a data point - you're the expert in the room.",
        "This isn't a one-time trip. COP31 is the launchpad: the presence, relationships, and power you build here carry into evergreen projects and a network that outlasts the summit.",
      ],
      accordion: "About the program",
      stats: [
        { value: "20", label: "ambassadors" },
        { value: "8-10", label: "online" },
        { value: "10-12", label: "at COP 31" },
      ],
      online: "3 week capacity building online",
      onlineDates: "[Oct 14 - Nov 4]",
      antalya: "1 week in Antalya",
      antalyaDates: "[Nov 9 - 16]",
    },
    aboutPopup: {
      title: "About the program",
      sessionsLead: "Over 3 weeks, you'll show up for 9 one-hour sessions",
      sessions: [
        "3 synchronous trainings",
        "3 one-on-one mentor check-ins",
        "3 sessions building something real to carry to",
      ],
      antalyaLead: "In Antalya, selected ambassadors will receive",
      antalya: [
        "Travel & Accommodation covered",
        "Daily per diem",
        "COP31 Blue Zone pass",
      ],
      blueZone: "Blue Zone",
      alsoLead: "You will also",
      also: [
        "Assist with the Climate Mobility Pavilion",
        "Meet dignitaries and collect their stories.",
        "Explain the Pavilion platform to visitors.",
        "Attend COP31 events and discussions",
      ],
    },
    resonate: {
      heading: "Any of this sound like you?",
      age: "Are you 19-26?",
      changemaker:
        "Are you organizing, speaking out, or building change where you live?\nJust getting started?",
      stories:
        "Have you or your community lived through climate-driven displacement?",
      indigenous:
        "Part of an Indigenous or Afro-descendant community, anywhere in the world?",
      interestsLead:
        "Got skills, experience, or genuine curiosity in any of these?",
      closing: "If yes, this program is for you",
      interests: [
        "Agriculture & Food",
        "AI & Data",
        "Climate Science",
        "Climate Justice",
        "Community organizing",
        "Disaster Response",
        "Energy",
        "Finance & Digital Assets",
        "Health & Wellbeing",
        "Human Rights",
        "Migration & Displacement",
        "Indigenous Rights",
        "Insurance & Finance",
        "Law & Policy",
        "Media & Storytelling",
        "Repairative Frameworks",
        "Technology",
        "Urban Planning",
      ],
    },
    whatYouGet: {
      heading: "What you get",
      cards: [
        {
          title: "4 week",
          badge: "Online",
          description:
            "Before COP, you'll train in storytelling, policy, negotiation, and media. Not every ambassador travels to COP31 - some stay online-only, but you're still fully looped into the pavilion's projects and the network we build together.",
        },
        {
          title: "1 week in Antalya",
          badge: "Travel",
          description:
            "Flights, visa, housing, meals - covered. You show up ready; we handle the logistics.",
        },
        {
          title: "",
          badge: "",
          description:
            "Official UNFCCC accreditation and Blue Zone Pavilion access.",
        },
        {
          title: "Mentorship",
          badge: "",
          description:
            "You won't navigate this alone. Negotiators, legal experts, scientists, storytellers, and organizers show up here for one reason: to back you and help you go further.",
        },
        {
          title: "Post-\nCOP",
          badge: "",
          description:
            "You go home ready to Build on Climate Mobility Solutions - an evergreen project, a lasting network, and real presence, relationships, and power.",
        },
      ],
    },
    applyBand: {
      body: "We fund young people to represent their communities at COP31 in Antalya - because the people most affected by climate displacement belong in the room, not just in the data.",
      process: "Application process",
    },
    applicationProcess: {
      title: "Application process",
      previous: "Previous",
      next: "Next",
      restart: "Restart",
      steps: [
        {
          date: "OCT 14 - Nov 16",
          label: "Submit your video application",
          body: "Answer a short set of questions about your background, story, and the message you'd bring to the pavilion. Respond by video, audio, or text — whichever you're most comfortable with. Questions can be answered in English and French.",
        },
        {
          date: "OCT 14 - Nov 16",
          label: "First-round interview",
          body: "Shortlisted applicants receive an interview invite by email, then complete a brief second round of async video questions covering programme readiness, working across disagreement, and travel document readiness (passport, visa, and any other documents your situation may require).",
        },
        {
          date: "OCT 14 - Nov 16",
          label: "Decision",
          body: "We'll email you with a decision. If you're not selected this round, we'll share other ways to stay involved with the Pavilion.",
        },
        {
          date: "OCT 14 - Nov 16",
          label: "Interview + Document",
          body: "If selected, we will set up a one-on-one call with you. After this, you'll upload your passport and sign a Travel Consent Form, all by email.",
        },
        {
          date: "OCT 14 - Nov 16",
          label: "Travel consent",
          body: "Once your documents and consent are confirmed, we'll email you your track placement. You'll join a 3-week pre-COP capacity-building programme, then travel to Antalya for 1 week as part of the delegation.",
        },
      ],
    },
    applyCta: "Apply",
    faq: {
      heading: "Frequently asked questions",
      items: [
        {
          q: "What is the Climate Refugee Pavilion?",
          a: "A dedicated space inside the COP31 Blue Zone where young people with lived experience of climate displacement, from the Global South, the African Diaspora, and Indigenous communities, take part directly in UN climate negotiations.",
        },
        {
          q: "Who can apply?",
          a: "Young people ages 19–26 who are organizing or building change where they live, who have lived through climate-driven displacement, or who are part of Indigenous or Afro-descendant communities — plus anyone with skills or curiosity across storytelling, advocacy, policy, and related fields.",
        },
        {
          q: "Do I have to travel to COP31 to participate?",
          a: "No. Not every ambassador travels to COP31 — some stay online-only. Online ambassadors are still fully looped into the pavilion's projects and the network we build together.",
        },
        {
          q: "What does the scholarship cover?",
          a: "For travel ambassadors: flights, visa, housing, and meals are covered. You also receive official UNFCCC accreditation and Blue Zone Pavilion access, plus mentorship throughout.",
        },
        {
          q: "How long does the application take?",
          a: "The first step is a short set of questions you can answer by video, audio, or text. Most applicants complete it in one sitting.",
        },
        {
          q: "What does the application process look like?",
          a: "Submit your application, complete a first-round interview if shortlisted, receive a decision by email, then — if selected — a one-on-one call, document upload, and travel consent before track placement.",
        },
        {
          q: "What will I actually do?",
          a: "You'll train before COP in storytelling, policy, negotiation, and media, then help shape the pavilion itself — online and, for travel ambassadors, during a week in Antalya — with mentorship from negotiators, legal experts, scientists, and organizers.",
        },
        {
          q: "What happens after I apply?",
          a: "We'll email you with a decision. If you're selected, you'll complete interviews and documents, join the 3-week capacity-building programme, and stay connected through evergreen projects and the network beyond the summit. If not, we'll share other ways to stay involved.",
        },
        {
          q: "Who do I contact with questions?",
          a: "Reach out through the contact options on this site, or email the Climate Refugee Pavilion team — we're happy to help.",
        },
      ],
    },
    testimonials: [
      {
        role: "Programme\nCoordinator",
        quote:
          '"This initiative empowers young climate advocates with essential tools for COP31."',
      },
      {
        role: "Youth Program\nLead (North America)",
        quote:
          "“The program amplifies young climate activists' voices, providing tools for advocacy at COP31”",
      },
      {
        role: "Youth Program\nLead ( Francophone )",
        quote:
          '"This initiative empowers young climate advocates with essential tools for COP31."',
      },
    ],
  },
  apply: {
    title: "Youth Ambassador Program",
    subtitle: "Bringing voices from around the world together",
    location: "COP31, Antalya, Türkiye",
    headline:
      "As an ambassador, you’ll join us on the path toward legal protection for climate refugees.",
    body: "You’ll represent your community, help spark conversations around climate mobility, and connect with participants from across the world. Together, we’ll help you strengthen your skills, amplify your voice, and contribute to solutions for climate mobility.",
    benefits: {
      travel: "Full travel, visa, accommodation, and per diem coverage",
      accreditationBefore: "Official UNFCCC accreditation and ",
      accreditationAfter: " Pavilion access",
      capacity: "A 3-week pre-COP capacity-building program",
      mentorship: "Direct mentorship",
      blueZone: "Blue Zone",
    },
    ages1926: "Ages\n19-26",
    online: "3 weeks online",
    antalya: "1 week in Antalya",
    ages1518: "Ages 15-18",
    ages2734: "Ages 27-34",
    interest: "Express interest",
    applyNow: "Apply Now",
    nominate: "Nominate",
    programDetails: "Program details",
    namePlaceholder: "name",
    emailPlaceholder: "Email",
    more: "More\ncom\ning\nsoon",
    heroAlt:
      "Coastal view of Antalya with the Taurus mountains across the bay",
    dates: "Oct 14 - Nov 16",
  },
  nominateLanding: {
    title: "Youth Ambassador Program Nomination",
    headline:
      "Ambassadors join us on the path toward legal protection for climate refugees.",
    body: "Representing their communities, help spark conversations around climate mobility, and connect with participants from across the world. Together, we'll help strengthen their skills, amplify their voice, and contribute to solutions for climate mobility.",
  },
  meta: {
    home: {
      title: "Climate Refugee Pavilion",
      description:
        "Making climate mobility impossible to ignore. Climate literacy at COP31, Antalya and online.",
    },
    programs: {
      title: "Youth Ambassador Program — Climate Refugee Pavilion",
      description:
        "A fully sponsored program for 19–26 year olds to represent their communities at COP31 in Antalya, Türkiye.",
    },
    about: {
      title: "About us — Climate Refugee Pavilion",
      description:
        "We build Climate Mobility Literacy by gathering local knowledge, amplifying lived experience, and bringing people together.",
    },
    partner: {
      title: "Partner with us — Climate Refugee Pavilion",
      description:
        "Support the Climate Refugee Pavilion — fund ambassador programs, storylines, or join us as a speaker.",
    },
    apply: {
      title: "Youth Ambassador Program",
      description:
        "Apply for the Climate Refugee Pavilion Youth Ambassador Program in Antalya, or express interest in other age groups.",
    },
    nominate: {
      title: "Youth Ambassador Program Nomination",
      description:
        "Nominate a 19–26 year old for the Climate Refugee Pavilion Youth Ambassador Program in Antalya.",
    },
    contact: {
      title: "Contact us — Climate Refugee Pavilion",
      description:
        "Get in touch with the Climate Refugee Pavilion — email, visit, or send a message.",
    },
  },
};

const fr = {
  a11y: {
    changeLanguage: "Changer de langue, {language} sélectionné",
    languageNames: { en: "anglais", fr: "français" },
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    playHome: "Lire la série Home",
    joinWaitlist: "Rejoindre la liste d'attente",
    email: "Adresse e-mail",
    emailInvalid: "Entrez une adresse e-mail valide",
    partnerUp: "Devenir partenaire",
    getInvolvedJump:
      "S'impliquer — ouvrir les options pour s'impliquer",
    closeGetInvolved: "Fermer S'impliquer",
    closeApplicationProcess: "Fermer le processus de candidature",
    closeAboutProgram: "Fermer À propos du programme",
    back: "Retour",
    backHome: "Retour à l'accueil",
    discord: "Rejoindre notre Discord",
    toggleAbout: "Afficher ou masquer le programme",
    prevTestimonial: "Témoignage précédent",
    nextTestimonial: "Témoignage suivant",
    platformGroups: "Groupes de la plateforme",
    youthAmbassadorCard:
      "Nominer quelqu'un au programme des jeunes ambassadeurs, 19-26 ans",
    programDetails: "Détails du programme, 19-26 ans",
    moreComingSoon: "Plus à venir",
    expressInterest: "Manifestez votre intérêt",
    closeExpressInterest: "Fermer Manifestez votre intérêt",
    submitInterest: "Envoyer mon intérêt",
  },
  nav: {
    about: "À propos",
    involved: "S'impliquer",
    contact: "Contact",
  },
  aboutUs: {
    heroTitle: "À propos",
    heroBody:
      "Nous construisons une culture de la mobilité climatique en rassemblant les savoirs locaux, en amplifiant l'expérience vécue, et en réunissant les gens pour comprendre ce que la mobilité climatique signifie selon les lieux.",
    statement:
      "Le Climate Refugee Pavilion sert de plateforme dédiée à la COP30 pour placer la mobilité humaine au cœur des négociations climatiques et amplifier les voix des communautés directement touchées par les déplacements liés au climat",
    statementTag: "Nous rendons la mobilité climatique impossible à ignorer",
    whatTitle: "Ce que nous faisons",
    whatBody:
      "Depuis 2020, nous travaillons sur le terrain au Zimbabwe, au Mozambique et en Afrique du Sud, aux côtés des personnes touchées par le climat et des institutions. Nous avons appris que le mot « réfugié » est controversé — alors nous avons redoublé d'efforts, et construisons aujourd'hui un moteur pour renforcer la compréhension mondiale de la mobilité climatique.",
    cards: [
      {
        title: "Relier les gens",
        body: "Nous explorons des voies pour favoriser un changement positif",
      },
      {
        title: "Raconter des histoires",
        body: "Notre mission vise un impact significatif",
      },
      {
        title: "Porter le changement",
        body: "Nous agissons pour faire la différence",
      },
    ],
    teamTitle: "Équipe",
    teamQuote:
      "« Le programme amplifie les voix des jeunes militant·e·s climatiques, et leur donne des outils de plaidoyer à la COP31 »",
    memberName: "Jane Doe",
    memberRole: "Manager",
    involvedTitle: "S'impliquer",
    youthDates: "9-20 nov.",
    youthTitle: "Programme jeunesse entièrement pris en charge en Turquie",
    partnerTitle: "Devenir partenaire",
  },
  partnerPage: {
    heroTitle: "Devenez partenaire",
    heroBody: "Soutenez l'ensemble de l'organisation",
    reachOut: "Nous écrire",
    ambassador: "Soutenir un programme d'ambassadeurs",
    storyline: "Soutenir une histoire précise",
    speaker: "Postuler comme intervenant·e",
  },
  contactPage: {
    title: "Contactez-nous",
    email: "email@gmail.com",
    address: "Adresse du bureau",
    phone: "Téléphone",
    name: "*Nom",
    organization: "Organisation",
    emailField: "*E-mail",
    mobile: "*Mobile",
    message: "Écrivez votre message ici",
    send: "Envoyer",
  },
  hero: {
    line1Before: "Le climat déplace les gens ",
    line1Accent: "autrement",
    line1After: " selon les lieux",
    line2: "Les réfugiés climatiques ne sont pas reconnus par la loi",
    photoAlt:
      "Des personnes qui discutent dans un pavillon, en intérieur",
  },
  heroExtension: {
    title:
      "Nous construisons un moyen de trouver le signal dans le bruit",
    subtitle: "Transformer les savoirs locaux en action mondiale",
    photoAlt:
      "Des personnes et des chiens qui marchent dans un champ au crépuscule",
  },
  pavilion: {
    location: "COP31, Antalya et en ligne",
    headline:
      "Rejoignez celles et ceux qui se réunissent pour comprendre la mobilité climatique et façonner des solutions",
    bringing: "Rassemblant",
    together: "ensemble",
    photoAlt: "Vue aérienne du site du pavillon COP31 à Antalya",
    groups: [
      "communautés",
      "Peuples autochtones",
      "scientifiques",
      "ong",
      "jeunes",
      "gouvernements",
      "ingénieurs",
      "entrepreneurs",
    ],
  },
  platform: {
    subtitle:
      "Recueillir les perspectives des communautés, des experts et des décideurs du monde entier",
    comingSoon: "Bientôt",
    groups: {
      beacons: {
        label: "Balises",
        blurb:
          "Relier les communautés comme autant de balises, pour éclairer des voies de collaboration",
      },
      missions: {
        label: "Missions",
        blurb:
          "Les missions sont des actions signalées par les balises et qui demandent une réponse",
      },
      ambassadors: {
        label: "Ambassadeurs",
        blurb:
          "Les personnes qui terminent nos programmes deviennent nos ambassadeurs.",
      },
    },
  },
  content: {
    kicker: "Notre",
    subtitle:
      "Des récits et des savoirs qui rendent la mobilité climatique plus facile à comprendre",
    homeCaption:
      "H.O.M.E. est une série de récits en cours sur la mobilité climatique dans le monde",
    featuredAlt: "Des amis réunis",
    comingSoon: "Bientôt",
    topics: {
      phone: "Technologie",
      getup: "Accessibilité",
      wish: "Réflexion et prédiction",
      chicken: "Adaptation",
      taste: "Nutrition et santé",
      cash: "Finance",
    },
  },
  involved: {
    title: "S'impliquer",
    tab: "S'impliquer",
    youth: "Programme des jeunes ambassadeurs",
    youthAlt: "Un groupe de jeunes qui sourient",
    nominate: "Proposer",
    apply: "Postuler",
    partner: "Devenir partenaire",
    dates: "9-20 nov.",
    programDates: "14 oct. - 16 nov.",
  },
  waitlist: {
    title: "Rejoindre la liste d'attente",
    emailPlaceholder: "E-mail",
    allSet: "C'est bon",
    checkEmail: "Consultez votre e-mail pour les mises à jour",
    photoAlt: "Soleil et brume sur un jardin",
  },
  sponsors: {
    ticker: "Rendre la mobilité climatique impossible à ignorer",
    title: "Nos partenaires",
    logosAlt: "ESG News et MEF",
  },
  footer: {
    copyright: "© {year} Climate Refugee Pavilion. Tous droits réservés.",
    columns: [
      { title: "Programmes", links: ["Récits", "Commanditaires", "Partenaires"] },
      { title: "Solidarité", links: ["Ambassadeurs", "Balises", "Plaidoyer"] },
      { title: "Mentions", links: ["Confidentialité", "Conditions", "Mission"] },
    ],
  },
  programs: {
    title: "19-26\nProgramme des jeunes ambassadeurs",
    about: {
      dates: "14 oct. - 16 nov.",
      location: "COP31, Antalya, Türkiye",
      lede: "Vous passerez une semaine dans la salle où se prennent les décisions climatiques — pas sur le banc de touche, mais en façonnant le pavillon lui-même.",
      body: [
        "Ce programme part d'une vérité : la migration est la façon dont les gens survivent aux crises depuis des générations, et si vous faites partie des millions de personnes déplacées par un climat qui change, vous n'êtes pas un point de données — vous êtes l'expert·e dans la salle.",
        "Ce n'est pas un voyage ponctuel. La COP31 est le tremplin : la présence, les relations et le pouvoir que vous construisez ici se prolongent dans des projets pérennes et un réseau qui dure au-delà du sommet.",
      ],
      accordion: "À propos du programme",
      stats: [
        { value: "20", label: "ambassadeurs" },
        { value: "8-10", label: "en ligne" },
        { value: "10-12", label: "à la COP 31" },
      ],
      online: "3 semaines de formation en ligne",
      onlineDates: "[14 oct. - 4 nov.]",
      antalya: "1 semaine à Antalya",
      antalyaDates: "[9 - 16 nov.]",
    },
    aboutPopup: {
      title: "À propos du programme",
      sessionsLead: "Sur 3 semaines, vous participerez à 9 séances d'une heure",
      sessions: [
        "3 formations synchrones",
        "3 suivis individuels avec un mentor",
        "3 séances pour construire quelque chose de concret à emporter",
      ],
      antalyaLead: "À Antalya, les ambassadeur·rice·s sélectionné·e·s recevront",
      antalya: [
        "Voyage et hébergement pris en charge",
        "Indemnité journalière",
        "Pass Blue Zone COP31",
      ],
      blueZone: "Blue Zone",
      alsoLead: "Vous allez aussi",
      also: [
        "Aider au Pavillon Climate Mobility",
        "Rencontrer des dignitaires et recueillir leurs récits.",
        "Expliquer la plateforme du Pavillon aux visiteur·euse·s.",
        "Assister aux événements et discussions de la COP31",
      ],
    },
    resonate: {
      heading: "Est-ce que ceci vous parle ?",
      age: "Avez-vous entre 19 et 26 ans ?",
      changemaker:
        "Organisez-vous, prenez-vous la parole, ou construisez-vous le changement là où vous vivez ?\nVous débutez seulement ?",
      stories:
        "Avez-vous, ou votre communauté, vécu un déplacement lié au climat ?",
      indigenous:
        "Faites-vous partie d'une communauté autochtone ou afro-descendante, où que ce soit dans le monde ?",
      interestsLead:
        "Avez-vous des compétences, de l'expérience, ou une vraie curiosité pour l'un de ces domaines ?",
      closing: "Si oui, ce programme est pour vous",
      interests: [
        "Agriculture et alimentation",
        "IA et données",
        "Science du climat",
        "Justice climatique",
        "Organisation communautaire",
        "Réponse aux catastrophes",
        "Énergie",
        "Finance et actifs numériques",
        "Santé et bien-être",
        "Droits humains",
        "Migration et déplacement",
        "Droits autochtones",
        "Assurance et finance",
        "Droit et politiques",
        "Médias et narration",
        "Cadres réparateurs",
        "Technologie",
        "Urbanisme",
      ],
    },
    whatYouGet: {
      heading: "Ce que vous obtenez",
      cards: [
        {
          title: "4 semaines",
          badge: "En ligne",
          description:
            "Avant la COP, vous vous formerez au récit, aux politiques, à la négociation et aux médias. Tous les ambassadeurs ne voyagent pas à la COP31 — certain·e·s restent uniquement en ligne, tout en restant pleinement intégré·e·s aux projets du pavillon et au réseau que nous construisons ensemble.",
        },
        {
          title: "1 semaine à Antalya",
          badge: "Voyage",
          description:
            "Vols, visa, hébergement, repas — pris en charge. Vous arrivez prêt·e ; nous gérons la logistique.",
        },
        {
          title: "",
          badge: "",
          description:
            "Accréditation officielle CCNUCC et accès au pavillon en Blue Zone.",
        },
        {
          title: "Mentorat",
          badge: "",
          description:
            "Vous ne serez pas seul·e. Négociateurs, juristes, scientifiques, narrateurs et organisateurs sont là pour une raison : vous soutenir et vous aider à aller plus loin.",
        },
        {
          title: "Après\nla COP",
          badge: "",
          description:
            "Vous rentrez prêt·e à construire sur les solutions de mobilité climatique — un projet pérenne, un réseau durable, et une vraie présence, des relations et du pouvoir.",
        },
      ],
    },
    applyBand: {
      body: "Nous finançons des jeunes pour représenter leurs communautés à la COP31 à Antalya — parce que les personnes les plus touchées par le déplacement climatique ont leur place dans la salle, pas seulement dans les données.",
      process: "Processus de candidature",
    },
    applicationProcess: {
      title: "Processus de candidature",
      previous: "Précédent",
      next: "Suivant",
      restart: "Recommencer",
      steps: [
        {
          date: "14 OCT - 16 NOV",
          label: "Soumettre votre candidature vidéo",
          body: "Répondez à un court questionnaire sur votre parcours, votre histoire et le message que vous apporteriez au pavilion. Répondez par vidéo, audio ou texte — selon ce qui vous convient le mieux. Les questions peuvent être traitées en anglais et en français.",
        },
        {
          date: "14 OCT - 16 NOV",
          label: "Entretien du premier tour",
          body: "Les candidats présélectionnés reçoivent une invitation à un entretien par e-mail, puis complètent un second tour de questions vidéo asynchrones sur la préparation au programme, le travail malgré les désaccords, et la disponibilité des documents de voyage (passeport, visa et tout autre document exigé par votre situation).",
        },
        {
          date: "14 OCT - 16 NOV",
          label: "Décision",
          body: "Nous vous enverrons notre décision par e-mail. Si vous n'êtes pas sélectionné·e ce tour-ci, nous partagerons d'autres façons de rester impliqué·e avec le Pavilion.",
        },
        {
          date: "14 OCT - 16 NOV",
          label: "Entretien + documents",
          body: "Si vous êtes sélectionné·e, nous organiserons un appel individuel. Ensuite, vous enverrez votre passeport et signerez un formulaire de consentement au voyage, le tout par e-mail.",
        },
        {
          date: "14 OCT - 16 NOV",
          label: "Consentement au voyage",
          body: "Une fois vos documents et votre consentement confirmés, nous vous enverrons par e-mail votre affectation de parcours. Vous rejoindrez un programme de renforcement des capacités de 3 semaines avant la COP, puis voyagerez à Antalya pendant 1 semaine au sein de la délégation.",
        },
      ],
    },
    applyCta: "Postuler",
    faq: {
      heading: "Questions fréquentes",
      items: [
        {
          q: "Qu'est-ce que le Climate Refugee Pavilion ?",
          a: "Un espace dédié dans la Blue Zone de la COP31 où des jeunes ayant une expérience vécue du déplacement climatique, du Sud global, de la diaspora africaine et des communautés autochtones, participent directement aux négociations climatiques de l'ONU.",
        },
        {
          q: "Qui peut postuler ?",
          a: "Des jeunes de 19 à 26 ans qui organisent ou construisent le changement là où ils vivent, qui ont vécu un déplacement lié au climat, ou qui font partie de communautés autochtones ou afro-descendantes — ainsi que toute personne avec des compétences ou une curiosité en narration, plaidoyer, politiques et domaines connexes.",
        },
        {
          q: "Dois-je voyager à la COP31 pour participer ?",
          a: "Non. Tous les ambassadeurs ne voyagent pas à la COP31 — certain·e·s restent uniquement en ligne, tout en restant pleinement intégré·e·s aux projets du pavillon et au réseau que nous construisons ensemble.",
        },
        {
          q: "Que couvre la bourse ?",
          a: "Pour les ambassadeurs voyageurs : vols, visa, hébergement et repas sont pris en charge. Vous recevez aussi une accréditation officielle CCNUCC et l'accès au pavillon en Blue Zone, plus un mentorat tout au long du parcours.",
        },
        {
          q: "Combien de temps prend la candidature ?",
          a: "La première étape est un court questionnaire auquel vous pouvez répondre par vidéo, audio ou texte. La plupart des candidat·e·s le terminent en une seule fois.",
        },
        {
          q: "À quoi ressemble le processus de candidature ?",
          a: "Soumettez votre candidature, passez un entretien de premier tour si vous êtes présélectionné·e, recevez une décision par e-mail, puis — si vous êtes sélectionné·e — un appel individuel, l'envoi de documents et le consentement au voyage avant l'affectation de parcours.",
        },
        {
          q: "Que vais-je concrètement faire ?",
          a: "Vous vous formerez avant la COP au récit, aux politiques, à la négociation et aux médias, puis aiderez à façonner le pavillon — en ligne et, pour les ambassadeurs voyageurs, pendant une semaine à Antalya — avec le mentorat de négociateurs, juristes, scientifiques et organisateurs.",
        },
        {
          q: "Que se passe-t-il après ma candidature ?",
          a: "Nous vous enverrons une décision par e-mail. Si vous êtes sélectionné·e, vous compléterez entretiens et documents, rejoindrez le programme de 3 semaines, et resterez connecté·e via des projets pérennes et le réseau au-delà du sommet. Sinon, nous partagerons d'autres façons de rester impliqué·e.",
        },
        {
          q: "Qui contacter pour des questions ?",
          a: "Utilisez les options de contact sur ce site, ou écrivez à l'équipe du Climate Refugee Pavilion — nous sommes là pour vous aider.",
        },
      ],
    },
    testimonials: [
      {
        role: "Programme\nCoordinateur",
        quote:
          "« Cette initiative donne aux jeunes défenseurs du climat les outils essentiels pour la COP31. »",
      },
      {
        role: "Responsable jeunesse\n(Amérique du Nord)",
        quote:
          "« Le programme amplifie la voix des jeunes activistes climatiques et leur donne des outils de plaidoyer pour la COP31. »",
      },
      {
        role: "Responsable jeunesse\n( Francophone )",
        quote:
          "« Cette initiative donne aux jeunes défenseurs du climat les outils essentiels pour la COP31. »",
      },
    ],
  },
  apply: {
    title: "Programme des jeunes ambassadeurs",
    subtitle: "Rassembler des voix du monde entier",
    location: "COP31, Antalya, Türkiye",
    headline:
      "En tant qu'ambassadeur·rice, vous nous rejoindrez sur le chemin vers une protection juridique pour les réfugiés climatiques.",
    body: "Vous représenterez votre communauté, aiderez à ouvrir des conversations sur la mobilité climatique, et créerez des liens avec des participant·e·s du monde entier. Ensemble, nous vous aiderons à renforcer vos compétences, à faire entendre votre voix, et à contribuer aux solutions pour la mobilité climatique.",
    benefits: {
      travel:
        "Prise en charge complète du voyage, du visa, de l'hébergement et des indemnités journalières",
      accreditationBefore: "Accréditation officielle CCNUCC et accès au pavillon en ",
      accreditationAfter: "",
      capacity:
        "Un programme de renforcement des capacités de 3 semaines avant la COP",
      mentorship: "Mentorat direct",
      blueZone: "Blue Zone",
    },
    ages1926: "19-26\nans",
    online: "3 semaines en ligne",
    antalya: "1 semaine à Antalya",
    ages1518: "15-18 ans",
    ages2734: "27-34 ans",
    interest: "Manifestez votre intérêt",
    applyNow: "Postuler",
    nominate: "Nominer",
    programDetails: "Détails du programme",
    namePlaceholder: "nom",
    emailPlaceholder: "E-mail",
    more: "Plus\nà\nve\nnir",
    heroAlt:
      "Vue côtière d'Antalya, avec les montagnes du Taurus de l'autre côté de la baie",
    dates: "14 oct. - 16 nov.",
  },
  nominateLanding: {
    title: "Nomination au programme des jeunes ambassadeurs",
    headline:
      "Les ambassadeur·rice·s nous rejoignent sur le chemin vers une protection juridique pour les réfugiés climatiques.",
    body: "En représentant leurs communautés, elles et ils aident à ouvrir des conversations sur la mobilité climatique et créent des liens avec des participant·e·s du monde entier. Ensemble, nous aiderons à renforcer leurs compétences, à faire entendre leur voix, et à contribuer aux solutions pour la mobilité climatique.",
  },
  meta: {
    home: {
      title: "Climate Refugee Pavilion",
      description:
        "Rendre la mobilité climatique impossible à ignorer. Culture climatique à la COP31, à Antalya et en ligne.",
    },
    programs: {
      title: "Programme des jeunes ambassadeurs — Climate Refugee Pavilion",
      description:
        "Un programme entièrement pris en charge pour les 19–26 ans, afin de représenter leurs communautés à la COP31 à Antalya, en Türkiye.",
    },
    about: {
      title: "À propos — Climate Refugee Pavilion",
      description:
        "Nous construisons une culture de la mobilité climatique en rassemblant les savoirs locaux et en amplifiant l'expérience vécue.",
    },
    partner: {
      title: "Devenez partenaire — Climate Refugee Pavilion",
      description:
        "Soutenez le Climate Refugee Pavilion — financez des programmes d'ambassadeurs, des histoires, ou rejoignez-nous comme intervenant·e.",
    },
    apply: {
      title: "Programme des jeunes ambassadeurs",
      description:
        "Postulez au programme des jeunes ambassadeurs du Climate Refugee Pavilion à Antalya, ou manifestez votre intérêt pour d'autres tranches d'âge.",
    },
    nominate: {
      title: "Nomination au programme des jeunes ambassadeurs",
      description:
        "Nominez une personne de 19–26 ans au programme des jeunes ambassadeurs du Climate Refugee Pavilion à Antalya.",
    },
    contact: {
      title: "Contactez-nous — Climate Refugee Pavilion",
      description:
        "Écrivez au Climate Refugee Pavilion — par e-mail, sur place, ou via le formulaire.",
    },
  },
} satisfies typeof en;

export const messages = { en, fr } as const;
export type Messages = typeof en;

export function t(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function copyFor(locale: Locale): Messages {
  return messages[locale];
}
