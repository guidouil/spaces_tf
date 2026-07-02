type ConsensusLocale = 'en' | 'fr';

export type ConsensusQuestionSeed = {
	id: string;
	category: string;
	tags?: string[];
	intensity?: 'light' | 'medium';
	translations: Record<
		ConsensusLocale,
		{
			question: string;
			optionA: string;
			optionB: string;
		}
	>;
};

export type ConsensusPack = {
	id: string;
	name: Record<ConsensusLocale, string>;
	questions: ConsensusQuestionSeed[];
};

export type ConsensusPackOption = {
	id: string;
	name: string;
	questionCount: number;
};

export const DEFAULT_CONSENSUS_PACK_ID = 'default';

const CONSENSUS_PACKS: ConsensusPack[] = [
	{
		id: DEFAULT_CONSENSUS_PACK_ID,
		name: {
			en: 'Default dilemmas',
			fr: 'Dilemmes par defaut'
		},
		questions: [
			q(
				'coffee-chocolate',
				'daily',
				'Would people rather give up coffee or chocolate?',
				'No more coffee',
				'No more chocolate',
				'Les gens prefereraient abandonner le cafe ou le chocolat ?',
				'Plus de cafe',
				'Plus de chocolat'
			),
			q(
				'music-movies',
				'pop-culture',
				'Would people rather live without music or movies?',
				'No music',
				'No movies',
				'Les gens prefereraient vivre sans musique ou sans films ?',
				'Sans musique',
				'Sans films'
			),
			q(
				'meeting-worst',
				'work',
				'What annoys people more in a meeting?',
				'The useless meeting',
				'The meeting that runs late',
				'Le pire en reunion ?',
				'La reunion inutile',
				'La reunion qui deborde'
			),
			q(
				'debate-annoying',
				'society',
				'What annoys people more in a debate?',
				'Someone who interrupts',
				'Someone who never answers',
				'Dans un debat, qu est-ce qui agace le plus ?',
				'Quelqu un qui coupe la parole',
				'Quelqu un qui ne repond jamais'
			),
			q(
				'x-suspicious',
				'web-culture',
				'What feels more suspicious on X?',
				'An account with no photo',
				'An account with too many flags',
				'Le plus suspect sur X ?',
				'Un compte sans photo',
				'Un compte avec trop de drapeaux'
			),
			q(
				'ai-trust',
				'ai',
				'Who would people trust more?',
				'A very polite AI',
				'A very confident human',
				'Les gens feraient plus confiance a...',
				'Une IA tres polie',
				'Un humain tres sur de lui'
			),
			q(
				'phone-battery',
				'tech',
				'What stresses people more?',
				'1% battery',
				'No signal',
				'Qu est-ce qui stresse le plus ?',
				'1 % de batterie',
				'Plus aucun reseau'
			),
			q(
				'remote-office',
				'work',
				'What would most people choose?',
				'Full remote',
				'Four-day week',
				'La majorite choisirait quoi ?',
				'Teletravail total',
				'Semaine de quatre jours'
			),
			q(
				'pizza-sushi',
				'food',
				'What wins for a group dinner?',
				'Pizza',
				'Sushi',
				'Qu est-ce qui gagne pour un diner de groupe ?',
				'Pizza',
				'Sushi'
			),
			q(
				'money-time',
				'money',
				'What would people rather have more of?',
				'Money',
				'Free time',
				'Les gens voudraient surtout plus de...',
				'Argent',
				'Temps libre'
			),
			q(
				'travel-plan',
				'travel',
				'What is the better trip?',
				'Everything planned',
				'Total improvisation',
				'Le meilleur voyage ?',
				'Tout planifie',
				'Improvisation totale'
			),
			q(
				'silent-room',
				'daily',
				'What is worse?',
				'Awkward silence',
				'Forced small talk',
				'Le pire ?',
				'Silence genant',
				'Petite conversation forcee'
			),
			q(
				'notifications',
				'tech',
				'What would people disable first?',
				'Work notifications',
				'Group chat notifications',
				'Les gens couperaient d abord...',
				'Les notifications du travail',
				'Les notifications de groupes'
			),
			q(
				'superpower',
				'absurd',
				'Which power wins?',
				'Pause time',
				'Read minds',
				'Quel pouvoir gagne ?',
				'Mettre le temps en pause',
				'Lire dans les pensees'
			),
			q(
				'x-drama',
				'web-culture',
				'What makes a Space more entertaining?',
				'A polite disagreement',
				'A chaotic clash',
				'Qu est-ce qui rend un Space plus divertissant ?',
				'Un desaccord poli',
				'Un clash chaotique'
			),
			q(
				'bad-date',
				'daily',
				'What is worse on a date?',
				'Only talks about themselves',
				'Checks phone nonstop',
				'Le pire en date ?',
				'Ne parle que de soi',
				'Regarde son telephone sans arret'
			),
			q(
				'ai-job',
				'ai',
				'What scares people more?',
				'AI taking jobs',
				'AI making mistakes confidently',
				'Qu est-ce qui fait le plus peur ?',
				'L IA qui prend des jobs',
				'L IA qui se trompe avec assurance'
			),
			q(
				'breakfast',
				'food',
				'What is the better breakfast?',
				'Sweet',
				'Savory',
				'Le meilleur petit-dejeuner ?',
				'Sucre',
				'Sale'
			),
			q(
				'voice-note',
				'tech',
				'What do people dislike more?',
				'A 4-minute voice note',
				'A 40-message thread',
				'Les gens detestent le plus...',
				'Un vocal de 4 minutes',
				'Une rafale de 40 messages'
			),
			q(
				'rich-famous',
				'pop-culture',
				'What would people choose?',
				'Be rich and unknown',
				'Be famous and average-paid',
				'Les gens choisiraient quoi ?',
				'Riche et inconnu',
				'Celebre avec salaire moyen'
			),
			q(
				'queue',
				'daily',
				'What tests patience more?',
				'A slow queue',
				'A buggy website',
				'Qu est-ce qui teste le plus la patience ?',
				'Une file lente',
				'Un site qui bug'
			),
			q(
				'work-message',
				'work',
				'What is more stressful?',
				'“Can we talk?”',
				'“Quick sync?”',
				'Le plus stressant ?',
				'On peut parler ?',
				'Petit point rapide ?'
			),
			q(
				'phone-call',
				'daily',
				'What do people avoid more?',
				'Unknown phone call',
				'Unexpected video call',
				'Les gens evitent le plus...',
				'Appel inconnu',
				'Visio surprise'
			),
			q(
				'holiday',
				'travel',
				'What holiday style wins?',
				'Beach and rest',
				'City and discovery',
				'Quel style de vacances gagne ?',
				'Plage et repos',
				'Ville et decouverte'
			),
			q(
				'takeout',
				'food',
				'What is the safer order?',
				'Burger',
				'Tacos',
				'La commande la plus sure ?',
				'Burger',
				'Tacos'
			),
			q(
				'public-speaking',
				'work',
				'What scares people more?',
				'Public speaking',
				'Asking a basic question',
				'Qu est-ce qui fait le plus peur ?',
				'Parler en public',
				'Poser une question basique'
			),
			q(
				'old-internet',
				'web-culture',
				'What do people miss more?',
				'Old forums',
				'Old YouTube',
				'Ce qui manque le plus ?',
				'Les vieux forums',
				'Le vieux YouTube'
			),
			q(
				'green-bubbles',
				'tech',
				'What would cause more drama?',
				'Leaving the group chat',
				'Muting the group chat',
				'Qu est-ce qui creerait le plus de drama ?',
				'Quitter le groupe',
				'Mettre le groupe en sourdine'
			),
			q(
				'lottery',
				'money',
				'What would most people do first after winning?',
				'Quit work',
				'Tell nobody',
				'Premier reflexe apres gagner au loto ?',
				'Quitter le travail',
				'Ne le dire a personne'
			),
			q(
				'restaurant',
				'food',
				'What ruins a restaurant more?',
				'Bad service',
				'Tiny portions',
				'Qu est-ce qui ruine le plus un restaurant ?',
				'Service mauvais',
				'Portions minuscules'
			),
			q(
				'movie-ending',
				'pop-culture',
				'What is worse?',
				'A predictable ending',
				'A confusing ending',
				'Le pire ?',
				'Une fin previsible',
				'Une fin incomprehensible'
			),
			q(
				'bad-wifi',
				'tech',
				'What is more annoying?',
				'Slow Wi-Fi',
				'No outlets',
				'Le plus penible ?',
				'Wi-Fi lent',
				'Pas de prises'
			),
			q(
				'office-food',
				'work',
				'What is more unforgivable at work?',
				'Stealing food',
				'Reply-all mistake',
				'Le plus impardonnable au travail ?',
				'Voler la nourriture',
				'Se tromper en repondant a tous'
			),
			q(
				'compliment',
				'society',
				'What do people prefer hearing?',
				'You are funny',
				'You are smart',
				'Les gens preferent entendre...',
				'Tu es drole',
				'Tu es intelligent'
			),
			q(
				'future',
				'absurd',
				'What would people rather know?',
				'Their future salary',
				'Their future reputation',
				'Les gens prefereraient connaitre...',
				'Leur futur salaire',
				'Leur future reputation'
			),
			q(
				'creator',
				'web-culture',
				'What is more cringe?',
				'Fake humility',
				'Fake expertise',
				'Le plus cringe ?',
				'Fausse modestie',
				'Fausse expertise'
			),
			q(
				'voice-ai',
				'ai',
				'What would feel stranger?',
				'AI therapist',
				'AI boss',
				'Le plus bizarre ?',
				'Therapeute IA',
				'Boss IA'
			),
			q(
				'train-plane',
				'travel',
				'What do people prefer?',
				'Long train',
				'Short flight',
				'Les gens preferent...',
				'Long train',
				'Vol court'
			),
			q(
				'cash-card',
				'money',
				'What feels more useful?',
				'Cash in wallet',
				'Phone payment',
				'Le plus utile ?',
				'Du cash sur soi',
				'Paiement par telephone'
			),
			q(
				'group-project',
				'work',
				'What is worse in a group project?',
				'The ghost',
				'The control freak',
				'Le pire dans un projet de groupe ?',
				'Le fantome',
				'Le control freak'
			),
			q(
				'spoilers',
				'pop-culture',
				'What is worse?',
				'Spoiler by accident',
				'Spoiler on purpose',
				'Le pire ?',
				'Spoiler par accident',
				'Spoiler expres'
			),
			q(
				'sleep-food',
				'daily',
				'What do people sacrifice first?',
				'Sleep',
				'Good food',
				'Les gens sacrifient d abord...',
				'Le sommeil',
				'Bien manger'
			),
			q(
				'hot-cold',
				'daily',
				'What is harder to tolerate?',
				'Too hot',
				'Too cold',
				'Le plus dur a supporter ?',
				'Trop chaud',
				'Trop froid'
			),
			q(
				'inbox',
				'work',
				'What feels better?',
				'Inbox zero',
				'Calendar empty',
				'Le plus satisfaisant ?',
				'Boite mail vide',
				'Calendrier vide'
			),
			q(
				'algorithm',
				'web-culture',
				'What annoys people more?',
				'Bad recommendations',
				'Posts out of order',
				'Ce qui agace le plus ?',
				'Mauvaises recommandations',
				'Posts dans le desordre'
			),
			q(
				'subscription',
				'money',
				'What hurts more?',
				'Forgotten subscription',
				'Delivery fee',
				'Ce qui fait le plus mal ?',
				'Abonnement oublie',
				'Frais de livraison'
			),
			q(
				'concert',
				'pop-culture',
				'What ruins a concert more?',
				'Tall person in front',
				'Phone filming all night',
				'Ce qui ruine le plus un concert ?',
				'Grand devant soi',
				'Telephone qui filme toute la soiree'
			),
			q(
				'hotel',
				'travel',
				'What matters more?',
				'Great bed',
				'Great location',
				'Le plus important a l hotel ?',
				'Tres bon lit',
				'Tres bon emplacement'
			),
			q(
				'robot-home',
				'ai',
				'What would people adopt first?',
				'Robot cleaner',
				'Robot cook',
				'Les gens adopteraient d abord...',
				'Robot menager',
				'Robot cuisinier'
			),
			q(
				'late-reply',
				'daily',
				'What feels more personal?',
				'Late reply',
				'Dry reply',
				'Qu est-ce qui semble le plus personnel ?',
				'Reponse tardive',
				'Reponse froide'
			),
			q(
				'social-event',
				'society',
				'What do people prefer?',
				'Leave early',
				'Arrive late',
				'Les gens preferent...',
				'Partir tot',
				'Arriver tard'
			),
			q(
				'passwords',
				'tech',
				'What is more painful?',
				'Forgotten password',
				'Two-factor loop',
				'Le plus penible ?',
				'Mot de passe oublie',
				'Boucle double authentification'
			),
			q(
				'snack',
				'food',
				'What snack wins?',
				'Chips',
				'Cookies',
				'Quel snack gagne ?',
				'Chips',
				'Cookies'
			),
			q(
				'advice',
				'society',
				'What lands better?',
				'Honest advice',
				'Supportive silence',
				'Ce qui passe le mieux ?',
				'Conseil honnete',
				'Silence bienveillant'
			),
			q(
				'morning-night',
				'daily',
				'What are most people?',
				'Morning person',
				'Night person',
				'La majorite est plutot...',
				'Du matin',
				'Du soir'
			),
			q(
				'tabs',
				'tech',
				'What is more chaotic?',
				'100 browser tabs',
				'Messy desktop',
				'Le plus chaotique ?',
				'100 onglets ouverts',
				'Bureau en bazar'
			),
			q(
				'brand',
				'web-culture',
				'What looks worse?',
				'Trying too hard',
				'Not trying at all',
				'Ce qui passe le moins bien ?',
				'Trop forcer',
				'Ne rien tenter'
			),
			q(
				'commute',
				'work',
				'What is worse?',
				'Long commute',
				'Open office',
				'Le pire ?',
				'Long trajet',
				'Open space'
			),
			q(
				'dessert',
				'food',
				'What dessert wins?',
				'Cake',
				'Ice cream',
				'Quel dessert gagne ?',
				'Gateau',
				'Glace'
			),
			q(
				'memory',
				'absurd',
				'What would people choose?',
				'Remember every name',
				'Remember every password',
				'Les gens choisiraient quoi ?',
				'Retenir tous les noms',
				'Retenir tous les mots de passe'
			),
			...getExtraConsensusQuestions()
		]
	}
];

function getExtraConsensusQuestions(): ConsensusQuestionSeed[] {
	return [
		q(
			'mute-block',
			'web-culture',
			'What is more satisfying?',
			'Mute',
			'Block',
			'Le plus satisfaisant ?',
			'Mute',
			'Bloquer'
		),
		q(
			'camera-mic',
			'work',
			'What causes more panic?',
			'Camera on by mistake',
			'Mic on by mistake',
			'Ce qui panique le plus ?',
			'Camera allumee par erreur',
			'Micro ouvert par erreur'
		),
		q(
			'rain-wind',
			'daily',
			'What is worse outside?',
			'Heavy rain',
			'Strong wind',
			'Le pire dehors ?',
			'Grosse pluie',
			'Vent fort'
		),
		q(
			'gift',
			'society',
			'What gift feels safer?',
			'Something useful',
			'Something personal',
			'Quel cadeau semble le plus sur ?',
			'Quelque chose d utile',
			'Quelque chose de personnel'
		),
		q(
			'lost-phone-wallet',
			'daily',
			'What is worse to lose?',
			'Phone',
			'Wallet',
			'Le pire a perdre ?',
			'Telephone',
			'Portefeuille'
		),
		q(
			'dm-email',
			'work',
			'What gets answered faster?',
			'DM',
			'Email',
			'Ce qui obtient une reponse plus vite ?',
			'DM',
			'Email'
		),
		q(
			'chatgpt-google',
			'tech',
			'What would people open first?',
			'ChatGPT',
			'Google',
			'Les gens ouvriraient d abord...',
			'ChatGPT',
			'Google'
		),
		q(
			'fame-money',
			'money',
			'What causes more problems?',
			'Too much fame',
			'Too much money',
			'Ce qui cause le plus de problemes ?',
			'Trop de notoriete',
			'Trop d argent'
		),
		q(
			'plane-seat',
			'travel',
			'What seat wins?',
			'Window',
			'Aisle',
			'Quelle place gagne ?',
			'Hublot',
			'Couloir'
		),
		q(
			'party',
			'society',
			'What is harder?',
			'Starting a conversation',
			'Leaving a conversation',
			'Le plus difficile ?',
			'Lancer une conversation',
			'Quitter une conversation'
		),
		q(
			'series-book',
			'pop-culture',
			'What would people rather finish?',
			'A great series',
			'A great book',
			'Les gens prefereraient finir...',
			'Une excellente serie',
			'Un excellent livre'
		),
		q(
			'fries-salad',
			'food',
			'What wins with a burger?',
			'Fries',
			'Salad',
			'Qu est-ce qui gagne avec un burger ?',
			'Frites',
			'Salade'
		),
		q(
			'privacy-convenience',
			'tech',
			'What do people choose in real life?',
			'Privacy',
			'Convenience',
			'En vrai, les gens choisissent...',
			'Vie privee',
			'Pratique'
		),
		q(
			'boss-client',
			'work',
			'Who is harder to handle?',
			'A vague boss',
			'A demanding client',
			'Le plus dur a gerer ?',
			'Un boss flou',
			'Un client exigeant'
		),
		q(
			'museum-market',
			'travel',
			'What is the better city activity?',
			'Museum',
			'Street market',
			'La meilleure activite en ville ?',
			'Musee',
			'Marche de rue'
		),
		q(
			'late-cancel',
			'daily',
			'What annoys more?',
			'Arriving late',
			'Canceling last minute',
			'Ce qui agace le plus ?',
			'Arriver en retard',
			'Annuler au dernier moment'
		),
		q(
			'ai-art-ai-code',
			'ai',
			'What divides people more?',
			'AI art',
			'AI code',
			'Ce qui divise le plus ?',
			'Art par IA',
			'Code par IA'
		),
		q(
			'cheap-fast',
			'money',
			'What matters more for delivery?',
			'Cheap',
			'Fast',
			'Le plus important en livraison ?',
			'Pas cher',
			'Rapide'
		),
		q(
			'playlist-podcast',
			'pop-culture',
			'What would people play on a walk?',
			'Playlist',
			'Podcast',
			'Les gens lanceraient quoi en balade ?',
			'Playlist',
			'Podcast'
		),
		q(
			'open-tabs-unread',
			'tech',
			'What looks more stressful?',
			'Too many tabs',
			'Too many unread messages',
			'Le plus stressant a voir ?',
			'Trop d onglets',
			'Trop de messages non lus'
		),
		q(
			'spicy-sweet',
			'food',
			'What flavor wins?',
			'Spicy',
			'Sweet',
			'Quelle saveur gagne ?',
			'Epice',
			'Sucre'
		),
		q(
			'save-spend',
			'money',
			'What sounds more like the group?',
			'Save first',
			'Enjoy first',
			'Ce qui ressemble le plus au groupe ?',
			'Epargner d abord',
			'Profiter d abord'
		),
		q(
			'leader-helper',
			'work',
			'What role do people prefer?',
			'Lead the project',
			'Support quietly',
			'Quel role les gens preferent ?',
			'Mener le projet',
			'Aider discretement'
		),
		q(
			'public-transport-car',
			'travel',
			'What would people choose daily?',
			'Public transport',
			'Car',
			'Au quotidien, les gens choisiraient...',
			'Transports en commun',
			'Voiture'
		),
		q(
			'trend-meme',
			'web-culture',
			'What dies faster?',
			'A trend',
			'A meme',
			'Ce qui meurt le plus vite ?',
			'Une tendance',
			'Un meme'
		),
		q(
			'truth-kindness',
			'society',
			'What matters more?',
			'Being honest',
			'Being kind',
			'Le plus important ?',
			'Etre honnete',
			'Etre gentil'
		),
		q(
			'delete-archive',
			'daily',
			'What do people do with old photos?',
			'Delete',
			'Archive forever',
			'Les gens font quoi des vieilles photos ?',
			'Supprimer',
			'Archiver pour toujours'
		),
		q(
			'robot-friend',
			'ai',
			'What would people accept sooner?',
			'AI assistant',
			'AI friend',
			'Les gens accepteraient d abord...',
			'Assistant IA',
			'Ami IA'
		),
		q(
			'cinema-home',
			'pop-culture',
			'What movie night wins?',
			'Cinema',
			'Home couch',
			'Quelle soiree film gagne ?',
			'Cinema',
			'Canape maison'
		),
		q(
			'train-delay-flight-delay',
			'travel',
			'What feels worse?',
			'Train delay',
			'Flight delay',
			'Ce qui semble pire ?',
			'Retard de train',
			'Retard d avion'
		),
		q(
			'small-talk-deep-talk',
			'society',
			'What do people prefer in a Space?',
			'Small talk',
			'Deep talk',
			'Les gens preferent quoi dans un Space ?',
			'Discussion legere',
			'Discussion profonde'
		),
		q(
			'bug-feature',
			'tech',
			'What phrase annoys more?',
			'It is a bug',
			'It is a feature',
			'Quelle phrase agace le plus ?',
			'C est un bug',
			'C est une feature'
		),
		q(
			'manager-meeting',
			'work',
			'What wastes more time?',
			'Bad manager',
			'Bad process',
			'Ce qui fait perdre le plus de temps ?',
			'Mauvais manager',
			'Mauvais process'
		),
		q(
			'tired-hungry',
			'daily',
			'What changes mood faster?',
			'Being tired',
			'Being hungry',
			'Ce qui change l humeur plus vite ?',
			'Etre fatigue',
			'Avoir faim'
		),
		q(
			'starter-dessert',
			'food',
			'What do people skip first?',
			'Starter',
			'Dessert',
			'Les gens zappent d abord...',
			'Entree',
			'Dessert'
		),
		q(
			'buy-rent',
			'money',
			'What feels more adult?',
			'Buying a home',
			'Investing money',
			'Ce qui fait le plus adulte ?',
			'Acheter un logement',
			'Investir son argent'
		),
		q(
			'verified-anonymous',
			'web-culture',
			'Who seems more credible?',
			'Verified account',
			'Anonymous expert',
			'Qui semble le plus credible ?',
			'Compte certifie',
			'Expert anonyme'
		),
		q(
			'calendar-todo',
			'work',
			'What helps more?',
			'Calendar',
			'To-do list',
			'Ce qui aide le plus ?',
			'Calendrier',
			'To-do list'
		),
		q(
			'dream-job-dream-city',
			'travel',
			'What would people choose?',
			'Dream job',
			'Dream city',
			'Les gens choisiraient quoi ?',
			'Job de reve',
			'Ville de reve'
		),
		q(
			'invisibility-teleport',
			'absurd',
			'Which power wins?',
			'Invisibility',
			'Teleportation',
			'Quel pouvoir gagne ?',
			'Invisibilite',
			'Teleportation'
		)
	];
}

export function getConsensusPackOptions(locale: string): ConsensusPackOption[] {
	const normalizedLocale = normalizeConsensusLocale(locale);

	return CONSENSUS_PACKS.map((pack) => ({
		id: pack.id,
		name: pack.name[normalizedLocale],
		questionCount: pack.questions.length
	}));
}

export function getConsensusQuestionSeeds(locale: string, packId = DEFAULT_CONSENSUS_PACK_ID) {
	const normalizedLocale = normalizeConsensusLocale(locale);
	const pack = CONSENSUS_PACKS.find((candidate) => candidate.id === packId) ?? CONSENSUS_PACKS[0];

	return pack.questions.map((question) => {
		const translation = question.translations[normalizedLocale];

		return {
			text: translation.question,
			choices: [translation.optionA, translation.optionB],
			category: question.category,
			seedId: question.id
		};
	});
}

function normalizeConsensusLocale(locale: string): ConsensusLocale {
	return locale === 'fr' ? 'fr' : 'en';
}

function q(
	id: string,
	category: string,
	enQuestion: string,
	enA: string,
	enB: string,
	frQuestion: string,
	frA: string,
	frB: string
): ConsensusQuestionSeed {
	return {
		id,
		category,
		intensity: 'light',
		translations: {
			en: { question: enQuestion, optionA: enA, optionB: enB },
			fr: { question: frQuestion, optionA: frA, optionB: frB }
		}
	};
}
