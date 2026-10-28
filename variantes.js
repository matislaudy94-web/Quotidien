// Fichier généré depuis variantes.json par : python3 generer_grilles_js.py
// Versions de rechange des grilles de démo (2 par grille), vérifiées par verifier_variantes.py.
window.QUOTIDIEN_VARIANTES = {
 "g1": [
  {
   "id": "g1b",
   "titre": "Grille 1 · version 2",
   "niveau": "facile",
   "intention": "Deux groupes concrets et deux expressions gourmandes qui se croisent : DUR semble aller avec « Pain ___ » et « Œuf ___ », mais une seule répartition utilise les 16 mots.",
   "groupes": [
    {
     "categorie": "Reptiles",
     "difficulte": "facile",
     "mots": [
      "IGUANE",
      "CAMÉLÉON",
      "VIPÈRE",
      "COBRA"
     ],
     "explication": "Quatre reptiles."
    },
    {
     "categorie": "Fromages",
     "difficulte": "facile",
     "mots": [
      "BRIE",
      "EMMENTAL",
      "GRUYÈRE",
      "MUNSTER"
     ],
     "explication": "Quatre fromages."
    },
    {
     "categorie": "Pain ___",
     "difficulte": "intermediaire",
     "mots": [
      "PERDU",
      "COMPLET",
      "GRILLÉ",
      "BRIOCHÉ"
     ],
     "explication": "Pain perdu, pain complet, pain grillé, pain brioché."
    },
    {
     "categorie": "Œuf ___",
     "difficulte": "difficile",
     "mots": [
      "DUR",
      "MOLLET",
      "POCHÉ",
      "COCOTTE"
     ],
     "explication": "Œuf dur, œuf mollet, œuf poché, œuf cocotte. On dit aussi « pain dur », mais les quatre autres pains sont déjà au complet."
    }
   ],
   "rattachements_plausibles": {
    "DUR": [
     "Pain ___"
    ],
    "MOLLET": [
     "Pain ___"
    ],
    "COCOTTE": [
     "Pain ___"
    ]
   }
  },
  {
   "id": "g1c",
   "titre": "Grille 1 · version 3",
   "niveau": "facile",
   "intention": "Deux groupes concrets et deux mots composés qui se croisent : on dit « coupe-feu » et « garde-feu », mais une seule répartition utilise les 16 mots.",
   "groupes": [
    {
     "categorie": "Races de chiens",
     "difficulte": "facile",
     "mots": [
      "CANICHE",
      "LABRADOR",
      "CHIHUAHUA",
      "DALMATIEN"
     ],
     "explication": "Quatre races de chiens."
    },
    {
     "categorie": "Légumes du marché",
     "difficulte": "facile",
     "mots": [
      "ARTICHAUT",
      "ASPERGE",
      "POIVRON",
      "FENOUIL"
     ],
     "explication": "Quatre légumes."
    },
    {
     "categorie": "Coupe-___",
     "difficulte": "intermediaire",
     "mots": [
      "FAIM",
      "CIRCUIT",
      "PAPIER",
      "FEU"
     ],
     "explication": "Coupe-faim, coupe-circuit, coupe-papier, coupe-feu."
    },
    {
     "categorie": "Garde-___",
     "difficulte": "difficile",
     "mots": [
      "MANGER",
      "CÔTE",
      "CHASSE",
      "MALADE"
     ],
     "explication": "Garde-manger, garde-côte, garde-chasse, garde-malade. Le garde-feu existe aussi, mais FEU est indispensable au groupe « Coupe-___ »."
    }
   ],
   "rattachements_plausibles": {
    "FEU": [
     "Garde-___"
    ]
   }
  }
 ],
 "g2": [
  {
   "id": "g2b",
   "titre": "Grille 2 · version 2",
   "niveau": "intermediaire",
   "intention": "Une expression à trou dont deux mots ont un autre groupe tentant : LOUP est un animal des bois et FRONT une partie du corps.",
   "groupes": [
    {
     "categorie": "Mammifères des forêts",
     "difficulte": "facile",
     "mots": [
      "CHEVREUIL",
      "BELETTE",
      "LYNX",
      "OURS"
     ],
     "explication": "Quatre mammifères qui vivent dans les forêts. Le loup aussi, mais il manque au groupe « ___ de mer »."
    },
    {
     "categorie": "Parties du corps",
     "difficulte": "facile",
     "mots": [
      "ÉPAULE",
      "POIGNET",
      "CHEVILLE",
      "NUQUE"
     ],
     "explication": "Quatre parties du corps. Le front aussi, mais il sert au groupe « ___ de mer »."
    },
    {
     "categorie": "Faire la ___",
     "difficulte": "intermediaire",
     "mots": [
      "SIESTE",
      "VAISSELLE",
      "MOUE",
      "LESSIVE"
     ],
     "explication": "Faire la sieste, faire la vaisselle, faire la moue, faire la lessive."
    },
    {
     "categorie": "___ de mer",
     "difficulte": "difficile",
     "mots": [
      "LOUP",
      "ARAIGNÉE",
      "FRONT",
      "BORD"
     ],
     "explication": "Loup de mer, araignée de mer, front de mer, bord de mer."
    }
   ],
   "rattachements_plausibles": {
    "LOUP": [
     "Mammifères des forêts"
    ],
    "FRONT": [
     "Parties du corps"
    ]
   }
  },
  {
   "id": "g2c",
   "titre": "Grille 2 · version 3",
   "niveau": "intermediaire",
   "intention": "Deux expressions à trou et un mot pivot : CHIEN semble aller avec les animaux de compagnie, mais il complète « Avoir du ___ ».",
   "groupes": [
    {
     "categorie": "Animaux de compagnie",
     "difficulte": "facile",
     "mots": [
      "LAPIN",
      "FURET",
      "PERRUCHE",
      "CANARI"
     ],
     "explication": "Quatre animaux que l'on garde à la maison. Le chien aussi, mais il manque au groupe « Avoir du ___ »."
    },
    {
     "categorie": "Au jeu de cartes",
     "difficulte": "facile",
     "mots": [
      "VALET",
      "TRÈFLE",
      "CARREAU",
      "JOKER"
     ],
     "explication": "Une figure (le valet), deux couleurs (trèfle et carreau) et une carte spéciale (le joker)."
    },
    {
     "categorie": "Poids ___",
     "difficulte": "intermediaire",
     "mots": [
      "PLUME",
      "LOURD",
      "COQ",
      "MORT"
     ],
     "explication": "Poids plume, poids lourd, poids coq, poids mort."
    },
    {
     "categorie": "Avoir du ___",
     "difficulte": "difficile",
     "mots": [
      "CRAN",
      "CULOT",
      "TOUPET",
      "CHIEN"
     ],
     "explication": "Avoir du cran, du culot, du toupet, du chien (du charme)."
    }
   ],
   "rattachements_plausibles": {
    "CHIEN": [
     "Animaux de compagnie"
    ]
   }
  }
 ],
 "g3": [
  {
   "id": "g3b",
   "titre": "Grille 3 · version 2",
   "niveau": "difficile",
   "intention": "Grille à piège : huit mots décrivent un caractère, mais quatre d'entre eux cachent une partie du corps. Il faut trouver le critère qui les sépare ; BÊTA, qui se dit d'une personne niaise, est un leurre de plus.",
   "groupes": [
    {
     "categorie": "Bébés animaux",
     "difficulte": "facile",
     "mots": [
      "CHATON",
      "AGNEAU",
      "POULAIN",
      "VEAU"
     ],
     "explication": "Les petits du chat, du mouton, du cheval et de la vache."
    },
    {
     "categorie": "Lettres grecques",
     "difficulte": "intermediaire",
     "mots": [
      "ALPHA",
      "BÊTA",
      "GAMMA",
      "DELTA"
     ],
     "explication": "Les quatre premières lettres de l'alphabet grec. « Bêta » se dit aussi d'une personne un peu niaise, mais il manque une lettre sans lui."
    },
    {
     "categorie": "Traits de caractère",
     "difficulte": "intermediaire",
     "mots": [
      "TÊTU",
      "TIMIDE",
      "BAVARD",
      "JALOUX"
     ],
     "explication": "Quatre traits de caractère qui ne cachent aucune partie du corps. Ils se trouvent une fois qu'on a compris ce qui distingue les quatre autres."
    },
    {
     "categorie": "Une partie du corps cachée",
     "difficulte": "difficile",
     "mots": [
      "SEREIN",
      "PRUDENT",
      "DOCILE",
      "COURAGEUX"
     ],
     "explication": "se-REIN, pru-DENT, do-CIL-e, COU-rageux. Ce sont aussi des traits de caractère : il fallait trouver ce qui sépare ces quatre-là des autres."
    }
   ],
   "rattachements_plausibles": {
    "SEREIN": [
     "Traits de caractère"
    ],
    "PRUDENT": [
     "Traits de caractère"
    ],
    "DOCILE": [
     "Traits de caractère"
    ],
    "COURAGEUX": [
     "Traits de caractère"
    ],
    "BÊTA": [
     "Traits de caractère"
    ]
   }
  },
  {
   "id": "g3c",
   "titre": "Grille 3 · version 3",
   "niveau": "difficile",
   "intention": "Grille à piège : huit fleurs et huit prénoms sont visibles, mais quatre mots sont les deux à la fois ; IRIS est en plus une partie de l'œil.",
   "groupes": [
    {
     "categorie": "Parties de l'œil",
     "difficulte": "intermediaire",
     "mots": [
      "PUPILLE",
      "RÉTINE",
      "CORNÉE",
      "CRISTALLIN"
     ],
     "explication": "Quatre parties de l'œil. L'iris en est une aussi, mais il sert au groupe des fleurs-prénoms."
    },
    {
     "categorie": "Prénoms",
     "difficulte": "intermediaire",
     "mots": [
      "JULES",
      "ARTHUR",
      "ÉLISE",
      "MANON"
     ],
     "explication": "Quatre prénoms qui ne sont pas des noms de fleurs."
    },
    {
     "categorie": "Fleurs du jardin",
     "difficulte": "intermediaire",
     "mots": [
      "GÉRANIUM",
      "PÉTUNIA",
      "TOURNESOL",
      "BÉGONIA"
     ],
     "explication": "Quatre fleurs qui ne sont pas des prénoms."
    },
    {
     "categorie": "Fleurs qui sont aussi des prénoms",
     "difficulte": "difficile",
     "mots": [
      "VIOLETTE",
      "CAPUCINE",
      "IRIS",
      "JACINTHE"
     ],
     "explication": "Violette, Capucine, Iris et Jacinthe sont à la fois des fleurs et des prénoms. Il fallait trouver ce qui sépare ces quatre-là des autres fleurs et des autres prénoms."
    }
   ],
   "rattachements_plausibles": {
    "VIOLETTE": [
     "Prénoms",
     "Fleurs du jardin"
    ],
    "CAPUCINE": [
     "Prénoms",
     "Fleurs du jardin"
    ],
    "IRIS": [
     "Prénoms",
     "Fleurs du jardin",
     "Parties de l'œil"
    ],
    "JACINTHE": [
     "Prénoms",
     "Fleurs du jardin"
    ]
   }
  }
 ],
 "g4": [
  {
   "id": "g4b",
   "titre": "Grille 4 · version 2",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Arbres",
     "difficulte": "facile",
     "mots": [
      "ÉRABLE",
      "SAULE",
      "TILLEUL",
      "PEUPLIER"
     ],
     "explication": "Quatre arbres."
    },
    {
     "categorie": "Oiseaux d'eau",
     "difficulte": "facile",
     "mots": [
      "CYGNE",
      "HÉRON",
      "PÉLICAN",
      "FLAMANT"
     ],
     "explication": "Quatre oiseaux qui vivent au bord de l'eau."
    },
    {
     "categorie": "Instruments de musique",
     "difficulte": "facile",
     "mots": [
      "BATTERIE",
      "VIOLONCELLE",
      "HAUTBOIS",
      "TUBA"
     ],
     "explication": "Quatre instruments de musique."
    },
    {
     "categorie": "Crème ___",
     "difficulte": "intermediaire",
     "mots": [
      "BRÛLÉE",
      "FRAÎCHE",
      "ANGLAISE",
      "CHANTILLY"
     ],
     "explication": "Crème brûlée, crème fraîche, crème anglaise, crème chantilly."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g4c",
   "titre": "Grille 4 · version 3",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Pays nordiques",
     "difficulte": "facile",
     "mots": [
      "SUÈDE",
      "NORVÈGE",
      "FINLANDE",
      "DANEMARK"
     ],
     "explication": "Quatre pays du nord de l'Europe."
    },
    {
     "categorie": "Meubles",
     "difficulte": "facile",
     "mots": [
      "ARMOIRE",
      "COMMODE",
      "CANAPÉ",
      "FAUTEUIL"
     ],
     "explication": "Quatre meubles."
    },
    {
     "categorie": "Matériel d'écolier",
     "difficulte": "facile",
     "mots": [
      "CRAYON",
      "FEUTRE",
      "CARTABLE",
      "ÉQUERRE"
     ],
     "explication": "Quatre fournitures d'écolier."
    },
    {
     "categorie": "Chaise ___",
     "difficulte": "intermediaire",
     "mots": [
      "LONGUE",
      "HAUTE",
      "ÉLECTRIQUE",
      "PLIANTE"
     ],
     "explication": "Chaise longue, chaise haute, chaise électrique, chaise pliante."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g5": [
  {
   "id": "g5b",
   "titre": "Grille 5 · version 2",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Sports d'équipe",
     "difficulte": "facile",
     "mots": [
      "BASKET",
      "HOCKEY",
      "BASEBALL",
      "WATER-POLO"
     ],
     "explication": "Quatre sports qui se jouent en équipe."
    },
    {
     "categorie": "Poissons de nos assiettes",
     "difficulte": "facile",
     "mots": [
      "SAUMON",
      "TRUITE",
      "MORUE",
      "DORADE"
     ],
     "explication": "Quatre poissons."
    },
    {
     "categorie": "Fruits du marché",
     "difficulte": "facile",
     "mots": [
      "FIGUE",
      "DATTE",
      "NECTARINE",
      "MIRABELLE"
     ],
     "explication": "Quatre fruits."
    },
    {
     "categorie": "Café ___",
     "difficulte": "intermediaire",
     "mots": [
      "SERRÉ",
      "ALLONGÉ",
      "GOURMAND",
      "LIÉGEOIS"
     ],
     "explication": "Café serré, café allongé, café gourmand, café liégeois."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g5c",
   "titre": "Grille 5 · version 3",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Sports de combat asiatiques",
     "difficulte": "facile",
     "mots": [
      "TAEKWONDO",
      "AÏKIDO",
      "KUNG-FU",
      "SUMO"
     ],
     "explication": "Quatre sports de combat venus d'Asie."
    },
    {
     "categorie": "Mammifères marins",
     "difficulte": "facile",
     "mots": [
      "ORQUE",
      "CACHALOT",
      "NARVAL",
      "MORSE"
     ],
     "explication": "Quatre grands mammifères marins."
    },
    {
     "categorie": "Plats français",
     "difficulte": "facile",
     "mots": [
      "RATATOUILLE",
      "CASSOULET",
      "CHOUCROUTE",
      "BLANQUETTE"
     ],
     "explication": "Quatre plats de la cuisine française."
    },
    {
     "categorie": "Grain de ___",
     "difficulte": "intermediaire",
     "mots": [
      "BEAUTÉ",
      "SABLE",
      "FOLIE",
      "RAISIN"
     ],
     "explication": "Grain de beauté, grain de sable, grain de folie, grain de raisin."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g6": [
  {
   "id": "g6b",
   "titre": "Grille 6 · version 2",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Bateaux",
     "difficulte": "facile",
     "mots": [
      "YACHT",
      "CATAMARAN",
      "PÉNICHE",
      "PAQUEBOT"
     ],
     "explication": "Quatre bateaux."
    },
    {
     "categorie": "Épices du placard",
     "difficulte": "facile",
     "mots": [
      "MUSCADE",
      "GINGEMBRE",
      "VANILLE",
      "PIMENT"
     ],
     "explication": "Quatre épices."
    },
    {
     "categorie": "Métiers",
     "difficulte": "facile",
     "mots": [
      "BOUCHER",
      "COIFFEUR",
      "MENUISIER",
      "JARDINIER"
     ],
     "explication": "Quatre métiers."
    },
    {
     "categorie": "Boîte de ___",
     "difficulte": "intermediaire",
     "mots": [
      "PANDORE",
      "MOUCHOIRS",
      "RÉCEPTION",
      "RANGEMENT"
     ],
     "explication": "Boîte de Pandore, boîte de mouchoirs, boîte de réception, boîte de rangement."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g6c",
   "titre": "Grille 6 · version 3",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Planètes",
     "difficulte": "facile",
     "mots": [
      "MERCURE",
      "URANUS",
      "NEPTUNE",
      "TERRE"
     ],
     "explication": "Quatre planètes du système solaire."
    },
    {
     "categorie": "Singes",
     "difficulte": "facile",
     "mots": [
      "GORILLE",
      "CHIMPANZÉ",
      "BABOUIN",
      "OUISTITI"
     ],
     "explication": "Quatre singes."
    },
    {
     "categorie": "Pâtes italiennes",
     "difficulte": "facile",
     "mots": [
      "TAGLIATELLE",
      "FUSILLI",
      "MACARONI",
      "CANNELLONI"
     ],
     "explication": "Quatre sortes de pâtes."
    },
    {
     "categorie": "Salade ___",
     "difficulte": "intermediaire",
     "mots": [
      "NIÇOISE",
      "COMPOSÉE",
      "CÉSAR",
      "VERTE"
     ],
     "explication": "Salade niçoise, salade composée, salade César, salade verte."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g7": [
  {
   "id": "g7b",
   "titre": "Grille 7 · version 2",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Peintres",
     "difficulte": "facile",
     "mots": [
      "MONET",
      "PICASSO",
      "MATISSE",
      "CÉZANNE"
     ],
     "explication": "Quatre peintres célèbres."
    },
    {
     "categorie": "Langues du monde",
     "difficulte": "facile",
     "mots": [
      "ITALIEN",
      "ESPAGNOL",
      "ARABE",
      "JAPONAIS"
     ],
     "explication": "Quatre langues."
    },
    {
     "categorie": "Ils vivent dans la savane",
     "difficulte": "facile",
     "mots": [
      "GAZELLE",
      "HYÈNE",
      "GNOU",
      "BUFFLE"
     ],
     "explication": "Quatre animaux de la savane africaine."
    },
    {
     "categorie": "Point de ___",
     "difficulte": "intermediaire",
     "mots": [
      "VUE",
      "CÔTÉ",
      "REPÈRE",
      "RENCONTRE"
     ],
     "explication": "Point de vue, point de côté, point de repère, point de rencontre."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g7c",
   "titre": "Grille 7 · version 3",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Compositeurs",
     "difficulte": "facile",
     "mots": [
      "MOZART",
      "BACH",
      "BEETHOVEN",
      "CHOPIN"
     ],
     "explication": "Quatre compositeurs de musique classique."
    },
    {
     "categorie": "Grandes villes françaises",
     "difficulte": "facile",
     "mots": [
      "MARSEILLE",
      "LILLE",
      "STRASBOURG",
      "RENNES"
     ],
     "explication": "Quatre villes de France."
    },
    {
     "categorie": "Insectes de l'été",
     "difficulte": "facile",
     "mots": [
      "CRIQUET",
      "SAUTERELLE",
      "GRILLON",
      "CIGALE"
     ],
     "explication": "Quatre insectes qu'on entend chanter l'été."
    },
    {
     "categorie": "Fin de ___",
     "difficulte": "intermediaire",
     "mots": [
      "MOIS",
      "SAISON",
      "PARTIE",
      "CARRIÈRE"
     ],
     "explication": "Fin de mois, fin de saison, fin de partie, fin de carrière."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g8": [
  {
   "id": "g8b",
   "titre": "Grille 8 · version 2",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Boissons alcoolisées",
     "difficulte": "facile",
     "mots": [
      "BIÈRE",
      "CHAMPAGNE",
      "WHISKY",
      "RHUM"
     ],
     "explication": "Quatre boissons alcoolisées."
    },
    {
     "categorie": "Dinosaures",
     "difficulte": "facile",
     "mots": [
      "TYRANNOSAURE",
      "TRICÉRATOPS",
      "DIPLODOCUS",
      "VÉLOCIRAPTOR"
     ],
     "explication": "Quatre dinosaures."
    },
    {
     "categorie": "Bijoux à porter",
     "difficulte": "facile",
     "mots": [
      "PENDENTIF",
      "GOURMETTE",
      "CHEVALIÈRE",
      "DIADÈME"
     ],
     "explication": "Quatre bijoux."
    },
    {
     "categorie": "Sous-___",
     "difficulte": "intermediaire",
     "mots": [
      "TITRE",
      "CHEF",
      "SOL",
      "VÊTEMENT"
     ],
     "explication": "Sous-titre, sous-chef, sous-sol, sous-vêtement."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g8c",
   "titre": "Grille 8 · version 3",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Provinces de France",
     "difficulte": "facile",
     "mots": [
      "BRETAGNE",
      "NORMANDIE",
      "ALSACE",
      "PROVENCE"
     ],
     "explication": "Quatre provinces historiques de France."
    },
    {
     "categorie": "Charcuterie",
     "difficulte": "facile",
     "mots": [
      "JAMBON",
      "SAUCISSON",
      "PÂTÉ",
      "RILLETTES"
     ],
     "explication": "Quatre produits de charcuterie."
    },
    {
     "categorie": "Étoffes",
     "difficulte": "facile",
     "mots": [
      "LIN",
      "SATIN",
      "CACHEMIRE",
      "DENIM"
     ],
     "explication": "Quatre tissus."
    },
    {
     "categorie": "Passe-___",
     "difficulte": "intermediaire",
     "mots": [
      "PARTOUT",
      "TEMPS",
      "MONTAGNE",
      "DROIT"
     ],
     "explication": "Passe-partout, passe-temps, passe-montagne, passe-droit."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g9": [
  {
   "id": "g9b",
   "titre": "Grille 9 · version 2",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Rongeurs",
     "difficulte": "facile",
     "mots": [
      "RAT",
      "GERBILLE",
      "CHINCHILLA",
      "PORC-ÉPIC"
     ],
     "explication": "Quatre rongeurs."
    },
    {
     "categorie": "Aux pieds",
     "difficulte": "facile",
     "mots": [
      "BOTTINE",
      "BALLERINE",
      "TONG",
      "ESPADRILLE"
     ],
     "explication": "Quatre sortes de chaussures."
    },
    {
     "categorie": "Pierres de bijouterie",
     "difficulte": "facile",
     "mots": [
      "DIAMANT",
      "JADE",
      "ONYX",
      "AGATE"
     ],
     "explication": "Quatre pierres utilisées en bijouterie."
    },
    {
     "categorie": "Tour de ___",
     "difficulte": "intermediaire",
     "mots": [
      "MAGIE",
      "TAILLE",
      "PASSE-PASSE",
      "FRANCE"
     ],
     "explication": "Tour de magie, tour de taille, tour de passe-passe, Tour de France."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g9c",
   "titre": "Grille 9 · version 3",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Appareils de la maison",
     "difficulte": "facile",
     "mots": [
      "ASPIRATEUR",
      "CONGÉLATEUR",
      "MICRO-ONDES",
      "CAFETIÈRE"
     ],
     "explication": "Quatre appareils électroménagers."
    },
    {
     "categorie": "Champignons",
     "difficulte": "facile",
     "mots": [
      "CÈPE",
      "GIROLLE",
      "MORILLE",
      "TRUFFE"
     ],
     "explication": "Quatre champignons comestibles."
    },
    {
     "categorie": "Les Trois Mousquetaires",
     "difficulte": "facile",
     "mots": [
      "ATHOS",
      "PORTHOS",
      "ARAMIS",
      "D'ARTAGNAN"
     ],
     "explication": "Athos, Porthos et Aramis, les trois mousquetaires d'Alexandre Dumas, et leur ami d'Artagnan."
    },
    {
     "categorie": "Mise en ___",
     "difficulte": "intermediaire",
     "mots": [
      "BOÎTE",
      "ORBITE",
      "GARDE",
      "PLIS"
     ],
     "explication": "Mise en boîte, mise en orbite, mise en garde, mise en plis."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g10": [
  {
   "id": "g10b",
   "titre": "Grille 10 · version 2",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Dieux grecs",
     "difficulte": "facile",
     "mots": [
      "POSÉIDON",
      "HADÈS",
      "APHRODITE",
      "ARTÉMIS"
     ],
     "explication": "Quatre dieux de la mythologie grecque."
    },
    {
     "categorie": "Jeux de société",
     "difficulte": "facile",
     "mots": [
      "MONOPOLY",
      "SCRABBLE",
      "CLUEDO",
      "MIKADO"
     ],
     "explication": "Quatre jeux de société."
    },
    {
     "categorie": "Fleurs parfumées",
     "difficulte": "facile",
     "mots": [
      "MIMOSA",
      "LAVANDE",
      "MAGNOLIA",
      "JASMIN"
     ],
     "explication": "Quatre plantes connues pour le parfum de leurs fleurs."
    },
    {
     "categorie": "___ noir",
     "difficulte": "intermediaire",
     "mots": [
      "MARCHÉ",
      "TABLEAU",
      "TROU",
      "HUMOUR"
     ],
     "explication": "Marché noir, tableau noir, trou noir, humour noir."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g10c",
   "titre": "Grille 10 · version 3",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Pays d'Amérique",
     "difficulte": "facile",
     "mots": [
      "CANADA",
      "MEXIQUE",
      "BRÉSIL",
      "CUBA"
     ],
     "explication": "Quatre pays du continent américain."
    },
    {
     "categorie": "Confiseries",
     "difficulte": "facile",
     "mots": [
      "SUCETTE",
      "DRAGÉE",
      "PRALINE",
      "CALISSON"
     ],
     "explication": "Quatre confiseries."
    },
    {
     "categorie": "Sports de précision",
     "difficulte": "facile",
     "mots": [
      "PÉTANQUE",
      "BOWLING",
      "GOLF",
      "FLÉCHETTES"
     ],
     "explication": "Quatre sports où il faut viser juste."
    },
    {
     "categorie": "___ rouge",
     "difficulte": "intermediaire",
     "mots": [
      "TAPIS",
      "CARTON",
      "CROIX",
      "ALERTE"
     ],
     "explication": "Tapis rouge, carton rouge, Croix-Rouge, alerte rouge."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g11": [
  {
   "id": "g11b",
   "titre": "Grille 11 · version 2",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Fleuves",
     "difficulte": "facile",
     "mots": [
      "RHIN",
      "TAMISE",
      "GANGE",
      "VOLGA"
     ],
     "explication": "Quatre fleuves du monde."
    },
    {
     "categorie": "Super-héros",
     "difficulte": "facile",
     "mots": [
      "BATMAN",
      "SUPERMAN",
      "HULK",
      "SPIDER-MAN"
     ],
     "explication": "Quatre super-héros de bande dessinée."
    },
    {
     "categorie": "Aromates",
     "difficulte": "facile",
     "mots": [
      "THYM",
      "ROMARIN",
      "LAURIER",
      "ORIGAN"
     ],
     "explication": "Quatre herbes aromatiques."
    },
    {
     "categorie": "Bonne ___",
     "difficulte": "intermediaire",
     "mots": [
      "HUMEUR",
      "ANNÉE",
      "MINE",
      "SOIRÉE"
     ],
     "explication": "Bonne humeur, bonne année, bonne mine, bonne soirée."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g11c",
   "titre": "Grille 11 · version 3",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Signes astrologiques",
     "difficulte": "facile",
     "mots": [
      "GÉMEAUX",
      "SCORPION",
      "SAGITTAIRE",
      "VERSEAU"
     ],
     "explication": "Quatre signes du zodiaque."
    },
    {
     "categorie": "Dans Astérix",
     "difficulte": "facile",
     "mots": [
      "OBÉLIX",
      "IDÉFIX",
      "PANORAMIX",
      "ASSURANCETOURIX"
     ],
     "explication": "Quatre personnages d'Astérix."
    },
    {
     "categorie": "Boutiques",
     "difficulte": "facile",
     "mots": [
      "FROMAGERIE",
      "POISSONNERIE",
      "QUINCAILLERIE",
      "PARFUMERIE"
     ],
     "explication": "Quatre commerces."
    },
    {
     "categorie": "Gros ___",
     "difficulte": "intermediaire",
     "mots": [
      "LOT",
      "MOT",
      "PLAN",
      "BONNET"
     ],
     "explication": "Gros lot, gros mot, gros plan, gros bonnet."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g12": [
  {
   "id": "g12b",
   "titre": "Grille 12 · version 2",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Créatures fantastiques",
     "difficulte": "facile",
     "mots": [
      "DRAGON",
      "LICORNE",
      "SIRÈNE",
      "CYCLOPE"
     ],
     "explication": "Quatre créatures des légendes."
    },
    {
     "categorie": "Monnaies du monde",
     "difficulte": "facile",
     "mots": [
      "ROUBLE",
      "PESO",
      "ROUPIE",
      "DINAR"
     ],
     "explication": "Quatre monnaies utilisées aujourd'hui."
    },
    {
     "categorie": "Maladies courantes",
     "difficulte": "facile",
     "mots": [
      "GRIPPE",
      "RHUME",
      "ANGINE",
      "OTITE"
     ],
     "explication": "Quatre maladies courantes."
    },
    {
     "categorie": "___ noire",
     "difficulte": "intermediaire",
     "mots": [
      "MARÉE",
      "LISTE",
      "BÊTE",
      "SÉRIE"
     ],
     "explication": "Marée noire, liste noire, bête noire, série noire."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g12c",
   "titre": "Grille 12 · version 3",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression courante.",
   "groupes": [
    {
     "categorie": "Habitations",
     "difficulte": "facile",
     "mots": [
      "TENTE",
      "TIPI",
      "VILLA",
      "MANOIR"
     ],
     "explication": "Quatre sortes d'habitations."
    },
    {
     "categorie": "Verbes de cris d'animaux",
     "difficulte": "facile",
     "mots": [
      "MIAULER",
      "ABOYER",
      "HENNIR",
      "BÊLER"
     ],
     "explication": "Le chat miaule, le chien aboie, le cheval hennit, le mouton bêle."
    },
    {
     "categorie": "Morceaux de viande",
     "difficulte": "facile",
     "mots": [
      "CÔTELETTE",
      "ESCALOPE",
      "TOURNEDOS",
      "MAGRET"
     ],
     "explication": "Quatre morceaux de viande."
    },
    {
     "categorie": "Carnet de ___",
     "difficulte": "intermediaire",
     "mots": [
      "NOTES",
      "BAL",
      "CHÈQUES",
      "VOYAGE"
     ],
     "explication": "Carnet de notes, carnet de bal, carnet de chèques, carnet de voyage."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g13": [
  {
   "id": "g13b",
   "titre": "Grille 13 · version 2",
   "niveau": "intermediaire",
   "intention": "Une expression, des petits mots de grammaire, un gâteau et des techniques de dessin. Deux pièges : OR est une conjonction et FARINE entre dans le gâteau, mais l'expression a besoin des deux.",
   "groupes": [
    {
     "categorie": "Rouler ___",
     "difficulte": "intermediaire",
     "mots": [
      "BOSSE",
      "MÉCANIQUES",
      "FARINE",
      "OR"
     ],
     "explication": "Rouler sa bosse, rouler des mécaniques, rouler quelqu'un dans la farine, rouler sur l'or."
    },
    {
     "categorie": "Conjonctions de coordination",
     "difficulte": "intermediaire",
     "mots": [
      "MAIS",
      "DONC",
      "NI",
      "CAR"
     ],
     "explication": "Quatre des sept conjonctions de coordination (mais, ou, et, donc, or, ni, car). Or en est une aussi, mais on roule sur l'or."
    },
    {
     "categorie": "Dans le gâteau au yaourt",
     "difficulte": "facile",
     "mots": [
      "LEVURE",
      "HUILE",
      "ŒUFS",
      "SUCRE"
     ],
     "explication": "Ce qu'on met dans le gâteau au yaourt. La farine aussi, mais on roule quelqu'un dans la farine."
    },
    {
     "categorie": "Techniques de dessin et de peinture",
     "difficulte": "intermediaire",
     "mots": [
      "AQUARELLE",
      "GOUACHE",
      "PASTEL",
      "FUSAIN"
     ],
     "explication": "On peint à l'aquarelle ou à la gouache, on dessine au pastel ou au fusain."
    }
   ],
   "rattachements_plausibles": {
    "OR": [
     "Conjonctions de coordination"
    ],
    "FARINE": [
     "Dans le gâteau au yaourt"
    ]
   }
  },
  {
   "id": "g13c",
   "titre": "Grille 13 · version 3",
   "niveau": "intermediaire",
   "intention": "Une expression et trois groupes concrets. Deux pièges : les POUX sont des parasites et MIDI est un moment de la journée, mais l'expression a besoin des deux. PENALTY se cherche aussi, mais il reste sur le terrain.",
   "groupes": [
    {
     "categorie": "Chercher ___",
     "difficulte": "intermediaire",
     "mots": [
      "MIDI",
      "POUX",
      "NOISE",
      "FORTUNE"
     ],
     "explication": "Chercher midi à quatorze heures, chercher des poux, chercher noise, chercher fortune."
    },
    {
     "categorie": "Parasites",
     "difficulte": "facile",
     "mots": [
      "TIQUE",
      "PUNAISE",
      "SANGSUE",
      "TÉNIA"
     ],
     "explication": "Quatre parasites. Les poux aussi, mais on les cherche."
    },
    {
     "categorie": "Moments de la journée",
     "difficulte": "intermediaire",
     "mots": [
      "AUBE",
      "MATINÉE",
      "CRÉPUSCULE",
      "SOIR"
     ],
     "explication": "Quatre moments de la journée. Midi aussi, mais on le cherche à quatorze heures."
    },
    {
     "categorie": "Au football",
     "difficulte": "intermediaire",
     "mots": [
      "CORNER",
      "PENALTY",
      "HORS-JEU",
      "TACLE"
     ],
     "explication": "Corner, penalty, hors-jeu, tacle : le vocabulaire d'un match de foot. On dit aussi d'un joueur qu'il « cherche le penalty », mais l'expression a déjà ses quatre mots."
    }
   ],
   "rattachements_plausibles": {
    "POUX": [
     "Parasites"
    ],
    "MIDI": [
     "Moments de la journée"
    ],
    "PENALTY": [
     "Chercher ___"
    ]
   }
  }
 ],
 "g14": [
  {
   "id": "g14b",
   "titre": "Grille 14 · version 2",
   "niveau": "intermediaire",
   "intention": "Deux pièges : CHANSONNETTE évoque la chanson et BOUCHON ferme une bouteille, mais l'expression a besoin des deux.",
   "groupes": [
    {
     "categorie": "Pousser ___",
     "difficulte": "difficile",
     "mots": [
      "CHANSONNETTE",
      "BOUCHON",
      "MÉMÉ",
      "VICE"
     ],
     "explication": "Pousser la chansonnette, pousser le bouchon (trop loin), pousser mémé dans les orties, pousser le vice (jusqu'à…)."
    },
    {
     "categorie": "Vocabulaire de la chanson",
     "difficulte": "intermediaire",
     "mots": [
      "REFRAIN",
      "COUPLET",
      "MÉLODIE",
      "TEMPO"
     ],
     "explication": "Quatre mots pour décrire une chanson. La chansonnette aussi, mais on la pousse."
    },
    {
     "categorie": "Installation électrique",
     "difficulte": "intermediaire",
     "mots": [
      "FUSIBLE",
      "DISJONCTEUR",
      "INTERRUPTEUR",
      "AMPOULE"
     ],
     "explication": "Quatre éléments de l'électricité d'une maison."
    },
    {
     "categorie": "Ils ferment un récipient",
     "difficulte": "intermediaire",
     "mots": [
      "COUVERCLE",
      "CAPSULE",
      "OPERCULE",
      "CAPUCHON"
     ],
     "explication": "Le couvercle d'une casserole, la capsule d'une bouteille, l'opercule d'un pot de yaourt, le capuchon d'un stylo ou d'un flacon. Le bouchon aussi, mais on le pousse trop loin."
    }
   ],
   "rattachements_plausibles": {
    "CHANSONNETTE": [
     "Vocabulaire de la chanson"
    ],
    "BOUCHON": [
     "Ils ferment un récipient"
    ]
   }
  },
  {
   "id": "g14c",
   "titre": "Grille 14 · version 3",
   "niveau": "intermediaire",
   "intention": "Deux pièges : CHARME relève de la sorcellerie et COMPTOIR se trouve au bistrot, mais l'expression a besoin des deux.",
   "groupes": [
    {
     "categorie": "Sous le ___",
     "difficulte": "difficile",
     "mots": [
      "CHARME",
      "COMPTOIR",
      "GUI",
      "SCEAU"
     ],
     "explication": "Être sous le charme, vendre sous le comptoir, s'embrasser sous le gui, garder sous le sceau du secret."
    },
    {
     "categorie": "Sorcellerie",
     "difficulte": "intermediaire",
     "mots": [
      "CHAUDRON",
      "GRIMOIRE",
      "POTION",
      "INCANTATION"
     ],
     "explication": "L'attirail de la sorcière. Le charme aussi (un sortilège), et les druides cueillent le gui, mais on est sous le charme et on s'embrasse sous le gui."
    },
    {
     "categorie": "Au bistrot",
     "difficulte": "intermediaire",
     "mots": [
      "ZINC",
      "TERRASSE",
      "DEMI",
      "GARÇON"
     ],
     "explication": "Le zinc, la terrasse, le demi de bière, le garçon de café. Le comptoir aussi, mais on vend sous le comptoir."
    },
    {
     "categorie": "Desserts glacés",
     "difficulte": "facile",
     "mots": [
      "SORBET",
      "ESQUIMAU",
      "GRANITÉ",
      "CORNET"
     ],
     "explication": "Quatre desserts glacés."
    }
   ],
   "rattachements_plausibles": {
    "CHARME": [
     "Sorcellerie"
    ],
    "COMPTOIR": [
     "Au bistrot"
    ],
    "GUI": [
     "Sorcellerie"
    ]
   }
  }
 ],
 "g15": [
  {
   "id": "g15b",
   "titre": "Grille 15 · version 2",
   "niveau": "intermediaire",
   "intention": "Grille à thème : des objets qui ont un col, des bras, des dents ou des poils. TRACTOPELLE a aussi des dents (celles de son godet) et PELUCHE des bras, mais une seule répartition utilise les 16 mots.",
   "groupes": [
    {
     "categorie": "Ils ont un col",
     "difficulte": "intermediaire",
     "mots": [
      "CHEMISIER",
      "FÉMUR",
      "POLO",
      "FLACON"
     ],
     "explication": "Col de chemisier, col du fémur, col de polo, col du flacon."
    },
    {
     "categorie": "Ils ont des bras",
     "difficulte": "intermediaire",
     "mots": [
      "TRACTOPELLE",
      "FLEUVE",
      "ROBOT",
      "POULPE"
     ],
     "explication": "Le bras de la tractopelle, les bras d'un fleuve, le bras du robot, les huit bras du poulpe."
    },
    {
     "categorie": "Ils ont des dents",
     "difficulte": "intermediaire",
     "mots": [
      "TIMBRE",
      "ENGRENAGE",
      "CRÉMAILLÈRE",
      "TRONÇONNEUSE"
     ],
     "explication": "Les dents du timbre, de l'engrenage, de la crémaillère et de la chaîne de tronçonneuse. La tractopelle aussi (celles de son godet), mais il faut son bras."
    },
    {
     "categorie": "Ils ont des poils",
     "difficulte": "intermediaire",
     "mots": [
      "BROSSE",
      "MOQUETTE",
      "PELUCHE",
      "PINCEAU"
     ],
     "explication": "Poils de brosse, de moquette, de peluche, de pinceau. La peluche a souvent des bras, mais il faut ses poils."
    }
   ],
   "rattachements_plausibles": {
    "TRACTOPELLE": [
     "Ils ont des dents"
    ],
    "PELUCHE": [
     "Ils ont des bras"
    ]
   }
  },
  {
   "id": "g15c",
   "titre": "Grille 15 · version 3",
   "niveau": "intermediaire",
   "intention": "Grille à thème : quatre expressions en « ___ de » (pomme, crise, bouche, pas). Aucun mot ne va avec deux débuts : il faut trouver le bon pour chacun.",
   "groupes": [
    {
     "categorie": "Pomme de ___",
     "difficulte": "intermediaire",
     "mots": [
      "DISCORDE",
      "DOUCHE",
      "AMOUR",
      "REINETTE"
     ],
     "explication": "Pomme de discorde, pomme de douche, pomme d'amour, pomme de reinette."
    },
    {
     "categorie": "Crise de ___",
     "difficulte": "intermediaire",
     "mots": [
      "RIRE",
      "LARMES",
      "QUARANTAINE",
      "ANGOISSE"
     ],
     "explication": "Crise de rire, crise de larmes, crise de la quarantaine, crise d'angoisse."
    },
    {
     "categorie": "Bouche de ___",
     "difficulte": "intermediaire",
     "mots": [
      "ÉGOUT",
      "INCENDIE",
      "AÉRATION",
      "CHALEUR"
     ],
     "explication": "Bouche d'égout, bouche d'incendie, bouche d'aération, bouche de chaleur."
    },
    {
     "categorie": "Pas de ___",
     "difficulte": "intermediaire",
     "mots": [
      "GÉANT",
      "DEUX",
      "VIS",
      "DANSE"
     ],
     "explication": "Pas de géant, pas de deux, pas de vis, pas de danse."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g16": [
  {
   "id": "g16b",
   "titre": "Grille 16 · version 2",
   "niveau": "intermediaire",
   "intention": "Grille à thème : des nuances de couleur. CHARBON est noir, mais on dit aussi gris charbon.",
   "groupes": [
    {
     "categorie": "Gris ___",
     "difficulte": "intermediaire",
     "mots": [
      "PERLE",
      "TOURTERELLE",
      "CENDRÉ",
      "TAUPE"
     ],
     "explication": "Gris perle, gris tourterelle, gris cendré, gris taupe. On entend parfois blanc perle, mais le blanc a déjà ses quatre nuances."
    },
    {
     "categorie": "Rose ___",
     "difficulte": "intermediaire",
     "mots": [
      "POUDRÉ",
      "FLUO",
      "INDIEN",
      "BÉBÉ"
     ],
     "explication": "Rose poudré, rose fluo, rose indien, rose bébé."
    },
    {
     "categorie": "Noir ___",
     "difficulte": "intermediaire",
     "mots": [
      "JAIS",
      "ENCRE",
      "ÉBÈNE",
      "CHARBON"
     ],
     "explication": "Noir de jais, noir d'encre, noir ébène, noir charbon. On dit aussi gris charbon, mais le gris a déjà ses quatre nuances."
    },
    {
     "categorie": "Blanc ___",
     "difficulte": "intermediaire",
     "mots": [
      "CASSÉ",
      "IVOIRE",
      "NACRÉ",
      "IMMACULÉ"
     ],
     "explication": "Blanc cassé, blanc ivoire, blanc nacré, blanc immaculé. Le rose nacré existe aussi, mais le rose est complet."
    }
   ],
   "rattachements_plausibles": {
    "CHARBON": [
     "Gris ___"
    ],
    "NACRÉ": [
     "Rose ___"
    ],
    "PERLE": [
     "Blanc ___"
    ]
   }
  },
  {
   "id": "g16c",
   "titre": "Grille 16 · version 3",
   "niveau": "intermediaire",
   "intention": "Grille à thème : la couleur vient après le mot (blanche, verte, bleue, grise). CARTE et ZONE vont avec presque toutes les couleurs, FÉE, LUMIÈRE et MATIÈRE avec deux : une seule répartition utilise les 16 mots.",
   "groupes": [
    {
     "categorie": "___ blanche",
     "difficulte": "intermediaire",
     "mots": [
      "ARME",
      "PAGE",
      "VOIX",
      "DAME"
     ],
     "explication": "Arme blanche, page blanche, voix blanche, dame blanche. La carte blanche, la zone blanche, la lumière blanche et la matière blanche du cerveau existent aussi, mais ces mots servent ailleurs."
    },
    {
     "categorie": "___ verte",
     "difficulte": "intermediaire",
     "mots": [
      "PLANTE",
      "SALADE",
      "FÉE",
      "VOIE"
     ],
     "explication": "Plante verte, salade verte, fée verte (l'absinthe), voie verte (la piste réservée aux vélos et aux piétons). La fée bleue de Pinocchio existe aussi, mais le bleu est complet."
    },
    {
     "categorie": "___ bleue",
     "difficulte": "intermediaire",
     "mots": [
      "FLEUR",
      "PLANÈTE",
      "HEURE",
      "LUMIÈRE"
     ],
     "explication": "Être fleur bleue, la planète bleue (la Terre), l'heure bleue (juste après le coucher du soleil), la lumière bleue des écrans. La lumière blanche existe aussi, mais le blanc est complet."
    },
    {
     "categorie": "___ grise",
     "difficulte": "intermediaire",
     "mots": [
      "MATIÈRE",
      "ÉMINENCE",
      "CARTE",
      "ZONE"
     ],
     "explication": "Matière grise, éminence grise, carte grise, zone grise. Carte et zone vont avec presque toutes les couleurs (carte blanche, verte ou bleue ; zone blanche, verte ou bleue), mais seul le gris a besoin d'elles."
    }
   ],
   "rattachements_plausibles": {
    "CARTE": [
     "___ blanche",
     "___ verte",
     "___ bleue"
    ],
    "ZONE": [
     "___ blanche",
     "___ verte",
     "___ bleue"
    ],
    "FÉE": [
     "___ bleue"
    ],
    "LUMIÈRE": [
     "___ blanche"
    ],
    "MATIÈRE": [
     "___ blanche"
    ]
   }
  }
 ],
 "g17": [
  {
   "id": "g17b",
   "titre": "Grille 17 · version 2",
   "niveau": "intermediaire",
   "intention": "Deux pièges : HAMBURGER se mange sur le pouce et BERLINE est une voiture, mais leur nom vient d'une ville, comme la baïonnette et le pékinois.",
   "groupes": [
    {
     "categorie": "Leur nom vient d'une ville",
     "difficulte": "difficile",
     "mots": [
      "HAMBURGER",
      "BERLINE",
      "BAÏONNETTE",
      "PÉKINOIS"
     ],
     "explication": "Le hamburger vient de Hambourg, la berline de Berlin, la baïonnette de Bayonne, le pékinois de Pékin."
    },
    {
     "categorie": "Onomatopées",
     "difficulte": "intermediaire",
     "mots": [
      "PLOUF",
      "VLAN",
      "BOUM",
      "PATATRAS"
     ],
     "explication": "Quatre mots qui imitent un bruit."
    },
    {
     "categorie": "Restauration rapide",
     "difficulte": "facile",
     "mots": [
      "TACOS",
      "PIZZA",
      "KEBAB",
      "HOT-DOG"
     ],
     "explication": "Quatre classiques de la restauration rapide. Le hamburger aussi, mais il doit son nom à Hambourg."
    },
    {
     "categorie": "Carrosseries de voiture",
     "difficulte": "intermediaire",
     "mots": [
      "COUPÉ",
      "MONOSPACE",
      "PICK-UP",
      "DÉCAPOTABLE"
     ],
     "explication": "Quatre types de voitures. La berline aussi, mais elle doit son nom à Berlin."
    }
   ],
   "rattachements_plausibles": {
    "HAMBURGER": [
     "Restauration rapide"
    ],
    "BERLINE": [
     "Carrosseries de voiture"
    ]
   }
  },
  {
   "id": "g17c",
   "titre": "Grille 17 · version 3",
   "niveau": "intermediaire",
   "intention": "Deux pièges : CRÂNE est un os et ANCRE se trouve dans un port, mais ils sont indispensables à l'anagramme.",
   "groupes": [
    {
     "categorie": "Anagrammes les uns des autres",
     "difficulte": "difficile",
     "mots": [
      "NACRE",
      "CRÂNE",
      "RANCE",
      "ANCRE"
     ],
     "explication": "Les mêmes cinq lettres A, C, E, N, R, dans un ordre différent (sans compter les accents)."
    },
    {
     "categorie": "Os du squelette",
     "difficulte": "intermediaire",
     "mots": [
      "TIBIA",
      "ROTULE",
      "VERTÈBRE",
      "CLAVICULE"
     ],
     "explication": "Quatre os du corps humain. Le crâne aussi, mais il est une anagramme."
    },
    {
     "categorie": "Dans un port",
     "difficulte": "intermediaire",
     "mots": [
      "QUAI",
      "PONTON",
      "DIGUE",
      "BOUÉE"
     ],
     "explication": "Quatre choses qu'on voit dans un port. L'ancre aussi, mais elle est une anagramme."
    },
    {
     "categorie": "Plateau de fruits de mer",
     "difficulte": "facile",
     "mots": [
      "LANGOUSTINE",
      "PALOURDE",
      "BIGORNEAU",
      "TOURTEAU"
     ],
     "explication": "Quatre fruits de mer. La nacre tapisse certains coquillages, mais elle est une anagramme."
    }
   ],
   "rattachements_plausibles": {
    "CRÂNE": [
     "Os du squelette"
    ],
    "ANCRE": [
     "Dans un port"
    ],
    "NACRE": [
     "Plateau de fruits de mer"
    ]
   }
  }
 ],
 "g18": [
  {
   "id": "g18b",
   "titre": "Grille 18 · version 2",
   "niveau": "intermediaire",
   "intention": "Grille à thème : « ils ont des… ». Des rayons, des lames, des cases et des épines.",
   "groupes": [
    {
     "categorie": "Ils ont des rayons",
     "difficulte": "intermediaire",
     "mots": [
      "ROUE",
      "RUCHE",
      "SUPERMARCHÉ",
      "BIBLIOTHÈQUE"
     ],
     "explication": "Les rayons d'une roue, d'une ruche (les rayons de miel), d'un supermarché, d'une bibliothèque."
    },
    {
     "categorie": "Ils ont des lames",
     "difficulte": "intermediaire",
     "mots": [
      "RASOIR",
      "PARQUET",
      "STORE",
      "PATIN"
     ],
     "explication": "Lames de rasoir, de parquet, de store, de patin à glace."
    },
    {
     "categorie": "Ils ont des cases",
     "difficulte": "intermediaire",
     "mots": [
      "ÉCHIQUIER",
      "CALENDRIER",
      "FORMULAIRE",
      "SUDOKU"
     ],
     "explication": "On coche ou on remplit leurs cases."
    },
    {
     "categorie": "Ils ont des épines",
     "difficulte": "intermediaire",
     "mots": [
      "CACTUS",
      "ROSIER",
      "CHARDON",
      "RONCE"
     ],
     "explication": "Quatre plantes qui piquent."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g18c",
   "titre": "Grille 18 · version 3",
   "niveau": "intermediaire",
   "intention": "Grille à thème : « ils ont des… ». Les crustacés et le perce-oreille ont aussi des antennes, mais ce sont leurs pinces qui comptent.",
   "groupes": [
    {
     "categorie": "Ils ont des pinces",
     "difficulte": "intermediaire",
     "mots": [
      "CRABE",
      "ÉTRILLE",
      "ÉCREVISSE",
      "PERCE-OREILLE"
     ],
     "explication": "Quatre animaux à pinces : le crabe, l'étrille (un petit crabe de nos côtes), l'écrevisse et le perce-oreille."
    },
    {
     "categorie": "Ils ont des antennes",
     "difficulte": "intermediaire",
     "mots": [
      "HANNETON",
      "RADIO",
      "SATELLITE",
      "TALKIE-WALKIE"
     ],
     "explication": "Un insecte et trois appareils à antenne. Le crabe, l'étrille, l'écrevisse et le perce-oreille en ont aussi, mais il faut leurs pinces."
    },
    {
     "categorie": "Ils ont des taches",
     "difficulte": "intermediaire",
     "mots": [
      "LÉOPARD",
      "SALAMANDRE",
      "GENETTE",
      "FAON"
     ],
     "explication": "Le léopard, la salamandre tachetée, la genette et le faon ont une robe tachetée."
    },
    {
     "categorie": "Ils ont des pédales",
     "difficulte": "intermediaire",
     "mots": [
      "PÉDALO",
      "ORGUE",
      "POUBELLE",
      "TRICYCLE"
     ],
     "explication": "On les fait marcher avec les pieds : le pédalo, l'orgue, la poubelle à pédale et le tricycle."
    }
   ],
   "rattachements_plausibles": {
    "CRABE": [
     "Ils ont des antennes"
    ],
    "ÉTRILLE": [
     "Ils ont des antennes"
    ],
    "ÉCREVISSE": [
     "Ils ont des antennes"
    ],
    "PERCE-OREILLE": [
     "Ils ont des antennes"
    ]
   }
  }
 ],
 "g19": [
  {
   "id": "g19b",
   "titre": "Grille 19 · version 2",
   "niveau": "intermediaire",
   "intention": "Deux expressions (ouvrir, rompre) et deux catégories plus sages.",
   "groupes": [
    {
     "categorie": "Ouvrir le ___",
     "difficulte": "intermediaire",
     "mots": [
      "JEU",
      "SCORE",
      "DÉBAT",
      "BEC"
     ],
     "explication": "Ouvrir le jeu, ouvrir le score, ouvrir le débat, ouvrir le bec (ne pas l'ouvrir, c'est ne rien dire)."
    },
    {
     "categorie": "Rompre ___",
     "difficulte": "intermediaire",
     "mots": [
      "GLACE",
      "JEÛNE",
      "RANGS",
      "SILENCE"
     ],
     "explication": "Rompre la glace, rompre le jeûne, rompre les rangs, rompre le silence."
    },
    {
     "categorie": "Gâteaux de pâtissier",
     "difficulte": "facile",
     "mots": [
      "FRAISIER",
      "OPÉRA",
      "PARIS-BREST",
      "SAINT-HONORÉ"
     ],
     "explication": "Quatre grands gâteaux de la pâtisserie française."
    },
    {
     "categorie": "Îles françaises",
     "difficulte": "facile",
     "mots": [
      "CORSE",
      "OLÉRON",
      "MARTINIQUE",
      "GUADELOUPE"
     ],
     "explication": "Quatre îles françaises."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g19c",
   "titre": "Grille 19 · version 3",
   "niveau": "intermediaire",
   "intention": "Deux expressions (sentir, boire) et deux catégories plus sages. SUISSE est un pays, mais pas des Balkans : on boit en Suisse.",
   "groupes": [
    {
     "categorie": "Sentir le ___",
     "difficulte": "intermediaire",
     "mots": [
      "ROUSSI",
      "SOUFRE",
      "VÉCU",
      "RENFERMÉ"
     ],
     "explication": "Sentir le roussi (mal tourner), sentir le soufre (avoir une réputation sulfureuse), sentir le vécu, sentir le renfermé."
    },
    {
     "categorie": "Boire ___",
     "difficulte": "intermediaire",
     "mots": [
      "PAROLES",
      "PETIT-LAIT",
      "SUISSE",
      "TIRE-LARIGOT"
     ],
     "explication": "Boire les paroles de quelqu'un, boire du petit-lait, boire en Suisse (boire seul, sans partager), boire à tire-larigot (beaucoup)."
    },
    {
     "categorie": "Pays des Balkans",
     "difficulte": "facile",
     "mots": [
      "SERBIE",
      "CROATIE",
      "ALBANIE",
      "BULGARIE"
     ],
     "explication": "Quatre pays de la péninsule des Balkans. La Suisse est un pays aussi, mais pas des Balkans : on boit en Suisse."
    },
    {
     "categorie": "Sauces",
     "difficulte": "facile",
     "mots": [
      "BÉARNAISE",
      "BÉCHAMEL",
      "AÏOLI",
      "PESTO"
     ],
     "explication": "Quatre sauces."
    }
   ],
   "rattachements_plausibles": {
    "SUISSE": [
     "Pays des Balkans"
    ]
   }
  }
 ],
 "g20": [
  {
   "id": "g20b",
   "titre": "Grille 20 · version 2",
   "niveau": "intermediaire",
   "intention": "HOLLANDE est un président et une région des Pays-Bas : un seul des deux groupes peut s'en passer.",
   "groupes": [
    {
     "categorie": "Présidents de la Ve République",
     "difficulte": "intermediaire",
     "mots": [
      "CHIRAC",
      "POMPIDOU",
      "MITTERRAND",
      "GISCARD"
     ],
     "explication": "Quatre présidents de la Ve République. Hollande aussi, mais il manque aux régions d'Europe."
    },
    {
     "categorie": "Régions d'Europe",
     "difficulte": "intermediaire",
     "mots": [
      "HOLLANDE",
      "TOSCANE",
      "BAVIÈRE",
      "CATALOGNE"
     ],
     "explication": "Quatre régions : aux Pays-Bas, en Italie, en Allemagne et en Espagne."
    },
    {
     "categorie": "Château fort",
     "difficulte": "facile",
     "mots": [
      "DONJON",
      "PONT-LEVIS",
      "CRÉNEAU",
      "DOUVES"
     ],
     "explication": "Quatre éléments d'un château fort."
    },
    {
     "categorie": "Anciennes unités de mesure",
     "difficulte": "intermediaire",
     "mots": [
      "LIEUE",
      "ARPENT",
      "TOISE",
      "AUNE"
     ],
     "explication": "Quatre mesures d'autrefois : la lieue, l'arpent, la toise, l'aune."
    }
   ],
   "rattachements_plausibles": {
    "HOLLANDE": [
     "Présidents de la Ve République"
    ]
   }
  },
  {
   "id": "g20c",
   "titre": "Grille 20 · version 3",
   "niveau": "intermediaire",
   "intention": "VOLTAIRE est un philosophe et un fauteuil : un seul des deux groupes peut s'en passer.",
   "groupes": [
    {
     "categorie": "Philosophes des Lumières",
     "difficulte": "intermediaire",
     "mots": [
      "VOLTAIRE",
      "ROUSSEAU",
      "DIDEROT",
      "MONTESQUIEU"
     ],
     "explication": "Quatre philosophes du XVIIIe siècle."
    },
    {
     "categorie": "Types de fauteuils",
     "difficulte": "intermediaire",
     "mots": [
      "BERGÈRE",
      "CRAPAUD",
      "CLUB",
      "CABRIOLET"
     ],
     "explication": "La bergère, le crapaud, le club et le cabriolet sont des fauteuils. Le voltaire aussi, mais il faut le philosophe."
    },
    {
     "categorie": "Accessoires de mode",
     "difficulte": "facile",
     "mots": [
      "FOULARD",
      "ÉTOLE",
      "POCHETTE",
      "CEINTURE"
     ],
     "explication": "Quatre accessoires de mode."
    },
    {
     "categorie": "Grands couturiers",
     "difficulte": "intermediaire",
     "mots": [
      "DIOR",
      "CHANEL",
      "GIVENCHY",
      "GAULTIER"
     ],
     "explication": "Quatre couturiers français."
    }
   ],
   "rattachements_plausibles": {
    "VOLTAIRE": [
     "Types de fauteuils"
    ]
   }
  }
 ],
 "g21": [
  {
   "id": "g21b",
   "titre": "Grille 21 · version 2",
   "niveau": "difficile",
   "intention": "Trois pièges : SERPENTIN, MASSEUR et CLÉMENCE semblent aller ailleurs. Il faut voir l'outil au début du mot.",
   "groupes": [
    {
     "categorie": "Commencent par un outil",
     "difficulte": "difficile",
     "mots": [
      "SCIENCE",
      "SERPENTIN",
      "MASSEUR",
      "CLÉMENCE"
     ],
     "explication": "SCIE-nce, SERPE-ntin, MASSE-ur, CLÉ-mence."
    },
    {
     "categorie": "Pour faire la fête",
     "difficulte": "intermediaire",
     "mots": [
      "CONFETTIS",
      "COTILLONS",
      "GUIRLANDE",
      "MIRLITON"
     ],
     "explication": "Quatre accessoires de fête. Le serpentin aussi, mais il commence par une serpe."
    },
    {
     "categorie": "Professions paramédicales",
     "difficulte": "intermediaire",
     "mots": [
      "ORTHOPHONISTE",
      "PODOLOGUE",
      "ERGOTHÉRAPEUTE",
      "DIÉTÉTICIEN"
     ],
     "explication": "Quatre professions paramédicales. Le masseur(-kinésithérapeute) aussi, mais il commence par une masse."
    },
    {
     "categorie": "Indulgence et pardon",
     "difficulte": "intermediaire",
     "mots": [
      "INDULGENCE",
      "MANSUÉTUDE",
      "MISÉRICORDE",
      "TOLÉRANCE"
     ],
     "explication": "Quatre façons de pardonner facilement. La clémence aussi, mais elle commence par une clé."
    }
   ],
   "rattachements_plausibles": {
    "SERPENTIN": [
     "Pour faire la fête"
    ],
    "MASSEUR": [
     "Professions paramédicales"
    ],
    "CLÉMENCE": [
     "Indulgence et pardon"
    ]
   }
  },
  {
   "id": "g21c",
   "titre": "Grille 21 · version 3",
   "niveau": "difficile",
   "intention": "Quatre pièges : RHUMATISME, GINGIVITE, LAITUE et ESTHÉTICIENNE semblent aller ailleurs. Il faut voir la boisson cachée.",
   "groupes": [
    {
     "categorie": "Cachent une boisson",
     "difficulte": "difficile",
     "mots": [
      "RHUMATISME",
      "GINGIVITE",
      "LAITUE",
      "ESTHÉTICIENNE"
     ],
     "explication": "RHUM-atisme, GIN-givite, LAIT-ue, es-THÉ-ticienne."
    },
    {
     "categorie": "Douleurs et inflammations",
     "difficulte": "intermediaire",
     "mots": [
      "LUMBAGO",
      "SCIATIQUE",
      "TENDINITE",
      "ARTHROSE"
     ],
     "explication": "Quatre maux qui font souffrir. Le rhumatisme et la gingivite aussi, mais ils cachent une boisson."
    },
    {
     "categorie": "Salades",
     "difficulte": "intermediaire",
     "mots": [
      "MÂCHE",
      "ROQUETTE",
      "FRISÉE",
      "CRESSON"
     ],
     "explication": "Quatre salades. La laitue aussi, mais elle cache du lait."
    },
    {
     "categorie": "Métiers de la beauté",
     "difficulte": "intermediaire",
     "mots": [
      "VISAGISTE",
      "MANUCURE",
      "MAQUILLEUSE",
      "BARBIER"
     ],
     "explication": "Quatre métiers de la beauté. L'esthéticienne aussi, mais elle cache du thé."
    }
   ],
   "rattachements_plausibles": {
    "RHUMATISME": [
     "Douleurs et inflammations"
    ],
    "GINGIVITE": [
     "Douleurs et inflammations"
    ],
    "LAITUE": [
     "Salades"
    ],
    "ESTHÉTICIENNE": [
     "Métiers de la beauté"
    ]
   }
  }
 ],
 "g22": [
  {
   "id": "g22b",
   "titre": "Grille 22 · version 2",
   "niveau": "intermediaire",
   "intention": "ÉLAN a des bois et COURAGE est une qualité, mais l'expression a besoin des deux.",
   "groupes": [
    {
     "categorie": "Prendre son ___",
     "difficulte": "intermediaire",
     "mots": [
      "ÉLAN",
      "MAL",
      "COURAGE",
      "ENVOL"
     ],
     "explication": "Prendre son élan, prendre son mal en patience, prendre son courage à deux mains, prendre son envol."
    },
    {
     "categorie": "Ils ont des bois",
     "difficulte": "intermediaire",
     "mots": [
      "RENNE",
      "DAIM",
      "WAPITI",
      "ORCHESTRE"
     ],
     "explication": "Les bois du renne, du daim et du wapiti ; les bois de l'orchestre (flûtes, clarinettes, hautbois…). L'élan aussi a des bois, mais on prend son élan."
    },
    {
     "categorie": "Qualités",
     "difficulte": "intermediaire",
     "mots": [
      "BONTÉ",
      "FRANCHISE",
      "GÉNÉROSITÉ",
      "HONNÊTETÉ"
     ],
     "explication": "Quatre qualités. Le courage aussi, mais on le prend à deux mains."
    },
    {
     "categorie": "Dans une salle de classe",
     "difficulte": "facile",
     "mots": [
      "MAPPEMONDE",
      "ESTRADE",
      "BUREAU",
      "CRAIE"
     ],
     "explication": "Quatre choses qu'on trouve dans une salle de classe."
    }
   ],
   "rattachements_plausibles": {
    "ÉLAN": [
     "Ils ont des bois"
    ],
    "COURAGE": [
     "Qualités"
    ]
   }
  },
  {
   "id": "g22c",
   "titre": "Grille 22 · version 3",
   "niveau": "intermediaire",
   "intention": "TRAC se ressent au théâtre et DESSUS est un adverbe de lieu, mais l'expression a besoin des deux. RÉPLIQUE est aussi la secousse qui suit un séisme, mais elle reste au théâtre.",
   "groupes": [
    {
     "categorie": "Avoir le ___",
     "difficulte": "intermediaire",
     "mots": [
      "TRAC",
      "DESSUS",
      "BÉGUIN",
      "TOURNIS"
     ],
     "explication": "Avoir le trac, avoir le dessus, avoir le béguin, avoir le tournis."
    },
    {
     "categorie": "Le monde du théâtre",
     "difficulte": "intermediaire",
     "mots": [
      "LOGE",
      "RÉPLIQUE",
      "ENTRACTE",
      "SOUFFLEUR"
     ],
     "explication": "Quatre mots du théâtre. Le trac aussi, mais on l'a."
    },
    {
     "categorie": "Adverbes de lieu",
     "difficulte": "intermediaire",
     "mots": [
      "AILLEURS",
      "DEHORS",
      "DEDANS",
      "LOIN"
     ],
     "explication": "Quatre adverbes de lieu. Dessus aussi, mais on a le dessus."
    },
    {
     "categorie": "Séisme",
     "difficulte": "intermediaire",
     "mots": [
      "SECOUSSE",
      "ÉPICENTRE",
      "MAGNITUDE",
      "FAILLE"
     ],
     "explication": "Quatre mots du séisme. La réplique aussi (la secousse qui suit), mais elle se donne au théâtre."
    }
   ],
   "rattachements_plausibles": {
    "TRAC": [
     "Le monde du théâtre"
    ],
    "DESSUS": [
     "Adverbes de lieu"
    ],
    "RÉPLIQUE": [
     "Séisme"
    ]
   }
  }
 ],
 "g23": [
  {
   "id": "g23b",
   "titre": "Grille 23 · version 2",
   "niveau": "difficile",
   "intention": "Quatre pièges : JOIE, TOUPIE, CANETTE et PICHET semblent aller ailleurs. Il faut voir l'oiseau caché.",
   "groupes": [
    {
     "categorie": "Cachent un oiseau",
     "difficulte": "difficile",
     "mots": [
      "JOIE",
      "TOUPIE",
      "CANETTE",
      "PICHET"
     ],
     "explication": "j-OIE, tou-PIE, CANE-tte, PIC-het."
    },
    {
     "categorie": "Émotions",
     "difficulte": "intermediaire",
     "mots": [
      "COLÈRE",
      "PEUR",
      "TRISTESSE",
      "SURPRISE"
     ],
     "explication": "Quatre émotions. La joie aussi, mais elle cache une oie."
    },
    {
     "categorie": "Jouets d'autrefois",
     "difficulte": "intermediaire",
     "mots": [
      "DIABOLO",
      "BILBOQUET",
      "CERCEAU",
      "OSSELETS"
     ],
     "explication": "Quatre jouets anciens. La toupie aussi, mais elle cache une pie."
    },
    {
     "categorie": "Récipients à boisson",
     "difficulte": "intermediaire",
     "mots": [
      "GOURDE",
      "FLASQUE",
      "GOBELET",
      "THERMOS"
     ],
     "explication": "Quatre récipients pour boire ou emporter à boire. La canette et le pichet aussi, mais ils cachent une cane et un pic."
    }
   ],
   "rattachements_plausibles": {
    "JOIE": [
     "Émotions"
    ],
    "TOUPIE": [
     "Jouets d'autrefois"
    ],
    "CANETTE": [
     "Récipients à boisson"
    ],
    "PICHET": [
     "Récipients à boisson"
    ]
   }
  },
  {
   "id": "g23c",
   "titre": "Grille 23 · version 3",
   "niveau": "difficile",
   "intention": "Quatre pièges : ABBÉ, ASSEZ, PÉPÉ et ÂGÉ semblent aller ailleurs. Il faut les dire à voix haute : deux lettres de l'alphabet.",
   "groupes": [
    {
     "categorie": "Se prononcent comme deux lettres",
     "difficulte": "difficile",
     "mots": [
      "ABBÉ",
      "ASSEZ",
      "PÉPÉ",
      "ÂGÉ"
     ],
     "explication": "A-B, A-C, P-P, A-G."
    },
    {
     "categorie": "Hommes d'Église",
     "difficulte": "intermediaire",
     "mots": [
      "CURÉ",
      "ÉVÊQUE",
      "CARDINAL",
      "MOINE"
     ],
     "explication": "Quatre hommes d'Église. L'abbé aussi, mais il se prononce A-B."
    },
    {
     "categorie": "Adverbes de quantité",
     "difficulte": "intermediaire",
     "mots": [
      "BEAUCOUP",
      "TROP",
      "PEU",
      "TELLEMENT"
     ],
     "explication": "Quatre adverbes de quantité. Assez aussi, mais il se prononce A-C."
    },
    {
     "categorie": "Vieillesse",
     "difficulte": "intermediaire",
     "mots": [
      "VIEILLARD",
      "SENIOR",
      "RETRAITÉ",
      "CENTENAIRE"
     ],
     "explication": "Quatre mots pour les personnes âgées. Pépé et âgé aussi, mais ils se prononcent P-P et A-G."
    }
   ],
   "rattachements_plausibles": {
    "ABBÉ": [
     "Hommes d'Église"
    ],
    "ASSEZ": [
     "Adverbes de quantité"
    ],
    "PÉPÉ": [
     "Vieillesse"
    ],
    "ÂGÉ": [
     "Vieillesse"
    ]
   }
  }
 ],
 "g24": [
  {
   "id": "g24b",
   "titre": "Grille 24 · version 2",
   "niveau": "difficile",
   "intention": "Quatre mots se prononcent comme un nombre. TROYES, SÈTE, VAIN et SANS attirent vers d'autres groupes.",
   "groupes": [
    {
     "categorie": "Se prononcent comme un nombre",
     "difficulte": "difficile",
     "mots": [
      "TROYES",
      "SÈTE",
      "VAIN",
      "SANS"
     ],
     "explication": "Trois, sept, vingt, cent."
    },
    {
     "categorie": "Villes de France",
     "difficulte": "facile",
     "mots": [
      "ROUEN",
      "BREST",
      "NICE",
      "DIJON"
     ],
     "explication": "Quatre villes françaises. Troyes et Sète aussi, mais elles se prononcent comme trois et sept."
    },
    {
     "categorie": "Synonymes d'inutile",
     "difficulte": "intermediaire",
     "mots": [
      "FUTILE",
      "STÉRILE",
      "SUPERFLU",
      "INEFFICACE"
     ],
     "explication": "Quatre façons de dire « qui ne sert à rien ». Vain aussi, mais il se prononce comme vingt."
    },
    {
     "categorie": "Prépositions",
     "difficulte": "intermediaire",
     "mots": [
      "AVEC",
      "CHEZ",
      "PARMI",
      "MALGRÉ"
     ],
     "explication": "Quatre prépositions. Sans aussi, mais il se prononce comme cent."
    }
   ],
   "rattachements_plausibles": {
    "TROYES": [
     "Villes de France"
    ],
    "SÈTE": [
     "Villes de France"
    ],
    "VAIN": [
     "Synonymes d'inutile"
    ],
    "SANS": [
     "Prépositions"
    ]
   }
  },
  {
   "id": "g24c",
   "titre": "Grille 24 · version 3",
   "niveau": "difficile",
   "intention": "Quatre mots courts se lisent à l'envers. SET, LET et COR attirent vers d'autres groupes.",
   "groupes": [
    {
     "categorie": "À l'envers, forment un autre mot",
     "difficulte": "difficile",
     "mots": [
      "SET",
      "LET",
      "COR",
      "NOM"
     ],
     "explication": "SET → TES, LET → TEL, COR → ROC, NOM → MON."
    },
    {
     "categorie": "Vocabulaire du tennis",
     "difficulte": "intermediaire",
     "mots": [
      "ACE",
      "BREAK",
      "VOLÉE",
      "LIFT"
     ],
     "explication": "Quatre mots du tennis. Le set et le let aussi, mais ils se lisent à l'envers."
    },
    {
     "categorie": "Maux de pieds",
     "difficulte": "intermediaire",
     "mots": [
      "DURILLON",
      "OIGNON",
      "VERRUE",
      "MYCOSE"
     ],
     "explication": "Quatre petits maux des pieds. Le cor aussi (le cor au pied), mais il se lit à l'envers."
    },
    {
     "categorie": "Tissus",
     "difficulte": "intermediaire",
     "mots": [
      "MOUSSELINE",
      "GABARDINE",
      "TWEED",
      "JERSEY"
     ],
     "explication": "Quatre tissus : la mousseline, la gabardine, le tweed et le jersey."
    }
   ],
   "rattachements_plausibles": {
    "SET": [
     "Vocabulaire du tennis"
    ],
    "LET": [
     "Vocabulaire du tennis"
    ],
    "COR": [
     "Maux de pieds"
    ]
   }
  }
 ],
 "g25": [
  {
   "id": "g25b",
   "titre": "Grille 25 · version 2",
   "niveau": "difficile",
   "intention": "Quatre couleurs se cachent dans des mots ordinaires : deux prénoms, un adjectif et un lieu de sport attirent ailleurs.",
   "groupes": [
    {
     "categorie": "Cachent une couleur",
     "difficulte": "difficile",
     "mots": [
      "BRUNO",
      "ROSELINE",
      "MÉDIOCRE",
      "PATINOIRE"
     ],
     "explication": "BRUN-o, ROSE-line, médi-OCRE, pati-NOIR-e."
    },
    {
     "categorie": "Prénoms courants",
     "difficulte": "facile",
     "mots": [
      "ANTOINE",
      "MATHILDE",
      "NICOLAS",
      "ÉLODIE"
     ],
     "explication": "Quatre prénoms. Bruno et Roseline aussi, mais ils cachent une couleur."
    },
    {
     "categorie": "Sans plus",
     "difficulte": "intermediaire",
     "mots": [
      "LAMBDA",
      "QUELCONQUE",
      "BANAL",
      "MOYEN"
     ],
     "explication": "Quatre façons de dire « ordinaire, pas terrible » (le citoyen lambda). Médiocre aussi, mais il cache l'ocre."
    },
    {
     "categorie": "Équipements sportifs",
     "difficulte": "intermediaire",
     "mots": [
      "GYMNASE",
      "STADE",
      "PISCINE",
      "VÉLODROME"
     ],
     "explication": "Quatre lieux où l'on fait du sport. La patinoire aussi, mais elle cache le noir."
    }
   ],
   "rattachements_plausibles": {
    "BRUNO": [
     "Prénoms courants"
    ],
    "ROSELINE": [
     "Prénoms courants"
    ],
    "MÉDIOCRE": [
     "Sans plus"
    ],
    "PATINOIRE": [
     "Équipements sportifs"
    ]
   }
  },
  {
   "id": "g25c",
   "titre": "Grille 25 · version 3",
   "niveau": "difficile",
   "intention": "Quatre mots du quotidien viennent du nom d'une personne : deux fleurs, un gilet et une chambre sous les toits brouillent les pistes.",
   "groupes": [
    {
     "categorie": "Viennent d'un nom de personne",
     "difficulte": "difficile",
     "mots": [
      "FUCHSIA",
      "GARDÉNIA",
      "CARDIGAN",
      "MANSARDE"
     ],
     "explication": "Le fuchsia doit son nom au botaniste Leonhart Fuchs, le gardénia au naturaliste Alexander Garden, le cardigan au comte de Cardigan, la mansarde à l'architecte François Mansart."
    },
    {
     "categorie": "Noms de fleurs",
     "difficulte": "facile",
     "mots": [
      "PERVENCHE",
      "PÂQUERETTE",
      "PRIMEVÈRE",
      "CROCUS"
     ],
     "explication": "Quatre fleurs. Le fuchsia et le gardénia aussi, mais ils doivent leur nom à une personne."
    },
    {
     "categorie": "Lainages",
     "difficulte": "intermediaire",
     "mots": [
      "CHANDAIL",
      "TRICOT",
      "CHÂLE",
      "PONCHO"
     ],
     "explication": "Quatre vêtements en laine ou en maille. Le cardigan aussi, mais il doit son nom au comte de Cardigan."
    },
    {
     "categorie": "Logements",
     "difficulte": "intermediaire",
     "mots": [
      "STUDIO",
      "DUPLEX",
      "LOFT",
      "PIED-À-TERRE"
     ],
     "explication": "Quatre façons de se loger. La mansarde aussi, mais elle doit son nom à l'architecte Mansart."
    }
   ],
   "rattachements_plausibles": {
    "FUCHSIA": [
     "Noms de fleurs"
    ],
    "GARDÉNIA": [
     "Noms de fleurs"
    ],
    "CARDIGAN": [
     "Lainages"
    ],
    "MANSARDE": [
     "Logements"
    ]
   }
  }
 ],
 "g26": [
  {
   "id": "g26b",
   "titre": "Grille 26 · version 2",
   "niveau": "difficile",
   "intention": "Quatre arbres se cachent dans des mots ordinaires, et chacun attire vers un autre groupe.",
   "groupes": [
    {
     "categorie": "Cachent un arbre",
     "difficulte": "difficile",
     "mots": [
      "PINGOUIN",
      "ÉNORME",
      "CONSIDÉRABLE",
      "CANIF"
     ],
     "explication": "PIN-gouin, én-ORME, consid-ÉRABLE, can-IF."
    },
    {
     "categorie": "Très grand",
     "difficulte": "intermediaire",
     "mots": [
      "MONUMENTAL",
      "IMMENSE",
      "COLOSSAL",
      "GIGANTESQUE"
     ],
     "explication": "Quatre mots pour « très grand ». Énorme et considérable aussi, mais ils cachent un arbre."
    },
    {
     "categorie": "Animaux noir et blanc",
     "difficulte": "intermediaire",
     "mots": [
      "PANDA",
      "MOUFFETTE",
      "ÉPAULARD",
      "CIGOGNE"
     ],
     "explication": "Quatre animaux au pelage ou au plumage noir et blanc (l'épaulard est l'autre nom de l'orque ; la cigogne blanche a les ailes bordées de noir). Le pingouin aussi, mais il cache le pin."
    },
    {
     "categorie": "Lames",
     "difficulte": "facile",
     "mots": [
      "POIGNARD",
      "SABRE",
      "DAGUE",
      "MACHETTE"
     ],
     "explication": "Quatre armes ou outils à lame. Le canif aussi, mais il cache l'if."
    }
   ],
   "rattachements_plausibles": {
    "PINGOUIN": [
     "Animaux noir et blanc"
    ],
    "ÉNORME": [
     "Très grand"
    ],
    "CONSIDÉRABLE": [
     "Très grand"
    ],
    "CANIF": [
     "Lames"
    ]
   }
  },
  {
   "id": "g26c",
   "titre": "Grille 26 · version 3",
   "niveau": "difficile",
   "intention": "Quatre poissons se cachent dans des mots ordinaires : un serpent, deux tromperies et un couvre-chef.",
   "groupes": [
    {
     "categorie": "Cachent un poisson",
     "difficulte": "difficile",
     "mots": [
      "PYTHON",
      "BARATIN",
      "SUPERCHERIE",
      "CALOTTE"
     ],
     "explication": "py-THON, BAR-atin, su-PERCHE-rie, ca-LOTTE."
    },
    {
     "categorie": "Serpents",
     "difficulte": "facile",
     "mots": [
      "ANACONDA",
      "COULEUVRE",
      "MAMBA",
      "CROTALE"
     ],
     "explication": "Quatre serpents. Le python aussi, mais il cache le thon."
    },
    {
     "categorie": "Tromperies",
     "difficulte": "intermediaire",
     "mots": [
      "ARNAQUE",
      "ESCROQUERIE",
      "IMPOSTURE",
      "FRAUDE"
     ],
     "explication": "Quatre façons de tromper. Le baratin et la supercherie aussi, mais ils cachent un poisson."
    },
    {
     "categorie": "Couvre-chefs",
     "difficulte": "intermediaire",
     "mots": [
      "TURBAN",
      "KÉPI",
      "TOQUE",
      "BICORNE"
     ],
     "explication": "Quatre choses qu'on porte sur la tête. La calotte aussi, mais elle cache la lotte."
    }
   ],
   "rattachements_plausibles": {
    "PYTHON": [
     "Serpents"
    ],
    "BARATIN": [
     "Tromperies"
    ],
    "SUPERCHERIE": [
     "Tromperies"
    ],
    "CALOTTE": [
     "Couvre-chefs"
    ]
   }
  }
 ],
 "g27": [
  {
   "id": "g27b",
   "titre": "Grille 27 · version 2",
   "niveau": "difficile",
   "intention": "Grille à thème : quatre verbes. SECOURS va avec deux d'entre eux.",
   "groupes": [
    {
     "categorie": "Passer ___",
     "difficulte": "difficile",
     "mots": [
      "PERMIS",
      "TRAPPE",
      "COMMANDE",
      "AVEUX"
     ],
     "explication": "Passer le permis, passer à la trappe, passer commande, passer aux aveux."
    },
    {
     "categorie": "Porter ___",
     "difficulte": "intermediaire",
     "mots": [
      "PLAINTE",
      "SECOURS",
      "ATTEINTE",
      "FRUITS"
     ],
     "explication": "Porter plainte, porter secours, porter atteinte, porter ses fruits."
    },
    {
     "categorie": "Prêter ___",
     "difficulte": "intermediaire",
     "mots": [
      "SERMENT",
      "MAIN-FORTE",
      "FLANC",
      "ALLÉGEANCE"
     ],
     "explication": "Prêter serment, prêter main-forte, prêter le flanc (à la critique), prêter allégeance. On prête aussi secours, mais il faut ici le porter."
    },
    {
     "categorie": "Piquer ___",
     "difficulte": "difficile",
     "mots": [
      "SPRINT",
      "CRISE",
      "ROUPILLON",
      "SUÉE"
     ],
     "explication": "Piquer un sprint, piquer une crise, piquer un roupillon, piquer une suée (familier)."
    }
   ],
   "rattachements_plausibles": {
    "SECOURS": [
     "Prêter ___"
    ]
   }
  },
  {
   "id": "g27c",
   "titre": "Grille 27 · version 3",
   "niveau": "difficile",
   "intention": "Grille à thème : quatre verbes. EMBUSCADE, BATEAU et PLANCHES vont avec deux verbes.",
   "groupes": [
    {
     "categorie": "Tendre ___",
     "difficulte": "intermediaire",
     "mots": [
      "PERCHE",
      "OREILLE",
      "BÂTON",
      "EMBUSCADE"
     ],
     "explication": "Tendre la perche, tendre l'oreille, tendre le bâton pour se faire battre, tendre une embuscade."
    },
    {
     "categorie": "Brûler ___",
     "difficulte": "intermediaire",
     "mots": [
      "ÉTAPES",
      "POLITESSE",
      "VAISSEAUX",
      "CARTOUCHES"
     ],
     "explication": "Brûler les étapes, brûler la politesse, brûler ses vaisseaux, brûler ses dernières cartouches."
    },
    {
     "categorie": "Mener ___",
     "difficulte": "difficile",
     "mots": [
      "BATEAU",
      "BARQUE",
      "ENQUÊTE",
      "TRAIN"
     ],
     "explication": "Mener en bateau, mener sa barque, mener l'enquête, mener grand train."
    },
    {
     "categorie": "Monter ___",
     "difficulte": "difficile",
     "mots": [
      "FLÈCHE",
      "CHEVAUX",
      "PLANCHES",
      "ERGOTS"
     ],
     "explication": "Monter en flèche, monter sur ses grands chevaux, monter sur les planches, monter sur ses ergots. On brûle aussi les planches, on monte un bateau à quelqu'un ou une embuscade, mais une seule répartition utilise les 16 mots."
    }
   ],
   "rattachements_plausibles": {
    "EMBUSCADE": [
     "Monter ___"
    ],
    "BATEAU": [
     "Monter ___"
    ],
    "PLANCHES": [
     "Brûler ___"
    ]
   }
  }
 ],
 "g28": [
  {
   "id": "g28b",
   "titre": "Grille 28 · version 2",
   "niveau": "difficile",
   "intention": "ANDOUILLE, BUSE, CORNICHON et COURGE ont l'air de charcuterie, d'oiseaux ou de légumes… mais ce sont surtout des noms d'oiseau pour un idiot.",
   "groupes": [
    {
     "categorie": "Pour traiter quelqu'un d'idiot",
     "difficulte": "difficile",
     "mots": [
      "ANDOUILLE",
      "BUSE",
      "CORNICHON",
      "COURGE"
     ],
     "explication": "Espèce d'andouille, de buse, de cornichon, de courge !"
    },
    {
     "categorie": "Oiseaux de proie",
     "difficulte": "intermediaire",
     "mots": [
      "ÉPERVIER",
      "MILAN",
      "CONDOR",
      "CRÉCERELLE"
     ],
     "explication": "Quatre rapaces. La buse aussi, mais c'est une insulte ici."
    },
    {
     "categorie": "Chez le charcutier",
     "difficulte": "facile",
     "mots": [
      "TERRINE",
      "CERVELAS",
      "CHIPOLATA",
      "MORTADELLE"
     ],
     "explication": "Quatre produits de charcuterie. L'andouille aussi, mais c'est une insulte ici."
    },
    {
     "categorie": "Au potager",
     "difficulte": "facile",
     "mots": [
      "CÉLERI",
      "BLETTE",
      "PANAIS",
      "RUTABAGA"
     ],
     "explication": "Quatre légumes du potager. Le cornichon et la courge aussi, mais ce sont des insultes ici."
    }
   ],
   "rattachements_plausibles": {
    "BUSE": [
     "Oiseaux de proie"
    ],
    "ANDOUILLE": [
     "Chez le charcutier"
    ],
    "CORNICHON": [
     "Au potager"
    ],
    "COURGE": [
     "Au potager"
    ]
   }
  },
  {
   "id": "g28c",
   "titre": "Grille 28 · version 3",
   "niveau": "difficile",
   "intention": "MILLET, BRAQUE, DAVID et RAPHAËL sont des peintres… et autre chose.",
   "groupes": [
    {
     "categorie": "Peintres célèbres",
     "difficulte": "difficile",
     "mots": [
      "MILLET",
      "BRAQUE",
      "DAVID",
      "RAPHAËL"
     ],
     "explication": "Jean-François Millet, Georges Braque, Jacques-Louis David, Raphaël."
    },
    {
     "categorie": "Céréales cultivées",
     "difficulte": "intermediaire",
     "mots": [
      "SEIGLE",
      "ÉPEAUTRE",
      "SORGHO",
      "SARRASIN"
     ],
     "explication": "Quatre grains cultivés comme des céréales. Le sarrasin, ou « blé noir », n'est pas une graminée mais une pseudo-céréale (de la famille de l'oseille) ; on le cultive et on le cuisine pourtant comme une céréale. Le millet aussi, mais c'est un peintre ici."
    },
    {
     "categorie": "Un peu fou",
     "difficulte": "facile",
     "mots": [
      "CINGLÉ",
      "MABOUL",
      "ZINZIN",
      "SIPHONNÉ"
     ],
     "explication": "Quatre façons familières de dire « un peu fou ». Braque aussi (« il est un peu braque »), mais c'est un peintre ici."
    },
    {
     "categorie": "Prénoms masculins",
     "difficulte": "facile",
     "mots": [
      "THOMAS",
      "JULIEN",
      "MAXIME",
      "BENOÎT"
     ],
     "explication": "Quatre prénoms. David et Raphaël aussi, mais ce sont des peintres ici."
    }
   ],
   "rattachements_plausibles": {
    "MILLET": [
     "Céréales cultivées"
    ],
    "BRAQUE": [
     "Un peu fou"
    ],
    "DAVID": [
     "Prénoms masculins"
    ],
    "RAPHAËL": [
     "Prénoms masculins"
    ]
   }
  }
 ],
 "g29": [
  {
   "id": "g29b",
   "titre": "Grille 29 · version 2",
   "niveau": "difficile",
   "intention": "Quatre mots du restaurant, de la boucherie ou de la peinture sont aussi des mots de l'informatique.",
   "groupes": [
    {
     "categorie": "Aussi en informatique",
     "difficulte": "difficile",
     "mots": [
      "MENU",
      "ONGLET",
      "ICÔNE",
      "TOILE"
     ],
     "explication": "Le menu déroulant, l'onglet du navigateur, l'icône d'un programme, la Toile (le Web)."
    },
    {
     "categorie": "Chez le boucher",
     "difficulte": "facile",
     "mots": [
      "HAMPE",
      "PALERON",
      "JARRET",
      "FAUX-FILET"
     ],
     "explication": "Quatre morceaux de bœuf. L'onglet aussi, mais c'est aussi un mot d'informatique."
    },
    {
     "categorie": "Au restaurant",
     "difficulte": "intermediaire",
     "mots": [
      "POURBOIRE",
      "NAPPE",
      "COUVERT",
      "RÉSERVATION"
     ],
     "explication": "Quatre choses du restaurant. Le menu aussi, mais c'est aussi un mot d'informatique."
    },
    {
     "categorie": "Œuvres peintes",
     "difficulte": "intermediaire",
     "mots": [
      "FRESQUE",
      "RETABLE",
      "TRIPTYQUE",
      "ENLUMINURE"
     ],
     "explication": "Quatre sortes d'œuvres souvent peintes (retables et triptyques ornent souvent les autels). L'icône et la toile aussi, mais ce sont aussi des mots d'informatique."
    }
   ],
   "rattachements_plausibles": {
    "MENU": [
     "Au restaurant"
    ],
    "ONGLET": [
     "Chez le boucher"
    ],
    "ICÔNE": [
     "Œuvres peintes"
    ],
    "TOILE": [
     "Œuvres peintes"
    ]
   }
  },
  {
   "id": "g29c",
   "titre": "Grille 29 · version 3",
   "niveau": "difficile",
   "intention": "Quatre oiseaux se font passer pour un titre de noblesse, un sommet ou des exclamations.",
   "groupes": [
    {
     "categorie": "Aussi des oiseaux",
     "difficulte": "difficile",
     "mots": [
      "DUC",
      "PIC",
      "CHOUETTE",
      "COUCOU"
     ],
     "explication": "Le duc (grand-duc, petit-duc), le pic, la chouette et le coucou sont des oiseaux."
    },
    {
     "categorie": "Titres de noblesse",
     "difficulte": "intermediaire",
     "mots": [
      "COMTE",
      "MARQUIS",
      "BARON",
      "VICOMTE"
     ],
     "explication": "Quatre titres de noblesse. Le duc aussi, mais c'est aussi un oiseau."
    },
    {
     "categorie": "En montagne",
     "difficulte": "facile",
     "mots": [
      "CIME",
      "CRÊTE",
      "COL",
      "VERSANT"
     ],
     "explication": "Quatre mots du relief montagneux. Le pic aussi, mais c'est aussi un oiseau."
    },
    {
     "categorie": "Exclamations",
     "difficulte": "facile",
     "mots": [
      "BRAVO",
      "YOUPI",
      "HOURRA",
      "GÉNIAL"
     ],
     "explication": "Quatre exclamations. « Chouette ! » et « Coucou ! » aussi, mais ce sont aussi des oiseaux."
    }
   ],
   "rattachements_plausibles": {
    "DUC": [
     "Titres de noblesse"
    ],
    "PIC": [
     "En montagne"
    ],
    "CHOUETTE": [
     "Exclamations"
    ],
    "COUCOU": [
     "Exclamations"
    ]
   }
  }
 ],
 "g30": [
  {
   "id": "g30b",
   "titre": "Grille 30 · version 2",
   "niveau": "difficile",
   "intention": "Quatre marques passées dans la langue courante : un alcool, un mot du golf et deux engins nautiques brouillent les pistes.",
   "groupes": [
    {
     "categorie": "Marques devenues des noms communs",
     "difficulte": "difficile",
     "mots": [
      "SCOTCH",
      "CADDIE",
      "ZODIAC",
      "JET-SKI"
     ],
     "explication": "Scotch (le ruban adhésif), Caddie (le chariot), Zodiac (le canot pneumatique) et Jet-Ski (le scooter des mers) sont des marques déposées."
    },
    {
     "categorie": "Spiritueux",
     "difficulte": "intermediaire",
     "mots": [
      "CALVADOS",
      "ARMAGNAC",
      "GRAPPA",
      "ABSINTHE"
     ],
     "explication": "Quatre alcools forts. Le scotch aussi (un whisky écossais), mais c'est surtout une marque de ruban adhésif ici."
    },
    {
     "categorie": "Au golf",
     "difficulte": "intermediaire",
     "mots": [
      "GREEN",
      "BUNKER",
      "PUTTER",
      "SWING"
     ],
     "explication": "Quatre mots du golf. Le caddie aussi (celui qui porte les clubs), mais c'est surtout une marque de chariot ici."
    },
    {
     "categorie": "Petites embarcations",
     "difficulte": "facile",
     "mots": [
      "CANOT",
      "RADEAU",
      "CHALOUPE",
      "DÉRIVEUR"
     ],
     "explication": "Quatre petits bateaux. Le zodiac et le jet-ski vont aussi sur l'eau, mais ce sont des marques."
    }
   ],
   "rattachements_plausibles": {
    "SCOTCH": [
     "Spiritueux"
    ],
    "CADDIE": [
     "Au golf"
    ],
    "ZODIAC": [
     "Petites embarcations"
    ],
    "JET-SKI": [
     "Petites embarcations"
    ]
   }
  },
  {
   "id": "g30c",
   "titre": "Grille 30 · version 3",
   "niveau": "difficile",
   "intention": "Quatre mots ordinaires finissent par un prénom, et chacun attire vers un autre groupe.",
   "groupes": [
    {
     "categorie": "Finissent par un prénom",
     "difficulte": "difficile",
     "mots": [
      "ÉLÈVE",
      "PHILOSOPHIE",
      "CALICE",
      "ÉGLISE"
     ],
     "explication": "él-ÈVE, philo-SOPHIE, c-ALICE, ég-LISE."
    },
    {
     "categorie": "Au lycée",
     "difficulte": "facile",
     "mots": [
      "PROVISEUR",
      "INTERNAT",
      "SURVEILLANT",
      "PERMANENCE"
     ],
     "explication": "Quatre mots du lycée. L'élève et la philosophie aussi, mais ils finissent par un prénom."
    },
    {
     "categorie": "Parties d'une fleur",
     "difficulte": "intermediaire",
     "mots": [
      "PISTIL",
      "OVAIRE",
      "SÉPALE",
      "COROLLE"
     ],
     "explication": "Quatre parties d'une fleur. Le calice aussi, mais il finit par Alice."
    },
    {
     "categorie": "Lieux de culte",
     "difficulte": "intermediaire",
     "mots": [
      "CHAPELLE",
      "BASILIQUE",
      "MOSQUÉE",
      "SYNAGOGUE"
     ],
     "explication": "Quatre lieux de culte. L'église aussi, mais elle finit par Lise."
    }
   ],
   "rattachements_plausibles": {
    "ÉLÈVE": [
     "Au lycée"
    ],
    "PHILOSOPHIE": [
     "Au lycée"
    ],
    "CALICE": [
     "Parties d'une fleur"
    ],
    "ÉGLISE": [
     "Lieux de culte"
    ]
   }
  }
 ],
 "g31": [
  {
   "id": "g31b",
   "titre": "Grille 31 · version 2",
   "niveau": "facile",
   "intention": "Trois catégories concrètes et une expression très connue.",
   "groupes": [
    {
     "categorie": "Clé de ___",
     "difficulte": "facile",
     "mots": [
      "VOÛTE",
      "FA",
      "CONTACT",
      "DOUZE"
     ],
     "explication": "Clé de voûte, clé de fa, clé de contact, clé de douze."
    },
    {
     "categorie": "Parties d'un vélo",
     "difficulte": "facile",
     "mots": [
      "GUIDON",
      "SELLE",
      "PÉDALE",
      "DÉRAILLEUR"
     ],
     "explication": "On les trouve sur une bicyclette."
    },
    {
     "categorie": "Trousse de secours",
     "difficulte": "facile",
     "mots": [
      "COMPRESSE",
      "SPARADRAP",
      "DÉSINFECTANT",
      "ATTELLE"
     ],
     "explication": "Pour les premiers soins."
    },
    {
     "categorie": "Plats italiens",
     "difficulte": "facile",
     "mots": [
      "LASAGNES",
      "RISOTTO",
      "OSSO-BUCO",
      "GNOCCHIS"
     ],
     "explication": "Quatre spécialités italiennes."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g31c",
   "titre": "Grille 31 · version 3",
   "niveau": "facile",
   "intention": "Trois catégories franches et une expression de cuisine.",
   "groupes": [
    {
     "categorie": "Pays d'Afrique",
     "difficulte": "facile",
     "mots": [
      "MAROC",
      "SÉNÉGAL",
      "KENYA",
      "ÉGYPTE"
     ],
     "explication": "Quatre pays africains."
    },
    {
     "categorie": "Fleurs ornementales",
     "difficulte": "facile",
     "mots": [
      "DAHLIA",
      "GLAÏEUL",
      "CAMÉLIA",
      "HORTENSIA"
     ],
     "explication": "Quatre fleurs."
    },
    {
     "categorie": "Boissons fraîches",
     "difficulte": "facile",
     "mots": [
      "LIMONADE",
      "SODA",
      "ORANGEADE",
      "GRENADINE"
     ],
     "explication": "À boire bien frais."
    },
    {
     "categorie": "Pommes ___",
     "difficulte": "facile",
     "mots": [
      "FRITES",
      "VAPEUR",
      "DAUPHINE",
      "SAUTÉES"
     ],
     "explication": "Pommes frites, pommes vapeur, pommes dauphine, pommes sautées."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g32": [
  {
   "id": "g32b",
   "titre": "Grille 32 · version 2",
   "niveau": "facile",
   "intention": "Une expression à trou, trois catégories franches.",
   "groupes": [
    {
     "categorie": "Fer à ___",
     "difficulte": "intermediaire",
     "mots": [
      "REPASSER",
      "CHEVAL",
      "FRISER",
      "SOUDER"
     ],
     "explication": "Fer à repasser, fer à cheval, fer à friser, fer à souder."
    },
    {
     "categorie": "Soupes",
     "difficulte": "facile",
     "mots": [
      "GASPACHO",
      "MINESTRONE",
      "VELOUTÉ",
      "BOUILLON"
     ],
     "explication": "À servir dans une assiette creuse ou un bol."
    },
    {
     "categorie": "Pays asiatiques",
     "difficulte": "facile",
     "mots": [
      "LAOS",
      "NÉPAL",
      "CAMBODGE",
      "MONGOLIE"
     ],
     "explication": "Quatre pays d'Asie."
    },
    {
     "categorie": "Parties d'un arbre",
     "difficulte": "facile",
     "mots": [
      "TRONC",
      "BRANCHE",
      "ÉCORCE",
      "SOUCHE"
     ],
     "explication": "Du pied jusqu'aux rameaux."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g32c",
   "titre": "Grille 32 · version 3",
   "niveau": "facile",
   "intention": "Une expression à trou, trois catégories du quotidien.",
   "groupes": [
    {
     "categorie": "Sac de ___",
     "difficulte": "intermediaire",
     "mots": [
      "NŒUDS",
      "PLAGE",
      "FRAPPE",
      "COUCHAGE"
     ],
     "explication": "Sac de nœuds, sac de plage, sac de frappe, sac de couchage."
    },
    {
     "categorie": "Oiseaux de mer",
     "difficulte": "facile",
     "mots": [
      "MOUETTE",
      "GOÉLAND",
      "CORMORAN",
      "ALBATROS"
     ],
     "explication": "Quatre oiseaux du bord de mer."
    },
    {
     "categorie": "Trousse de toilette",
     "difficulte": "facile",
     "mots": [
      "SHAMPOING",
      "DENTIFRICE",
      "DÉODORANT",
      "SAVONNETTE"
     ],
     "explication": "Pour se laver et se préparer."
    },
    {
     "categorie": "Légumineuses",
     "difficulte": "facile",
     "mots": [
      "LENTILLE",
      "FLAGEOLET",
      "FÈVE",
      "SOJA"
     ],
     "explication": "Quatre plantes dont on mange les graines, qui poussent dans des gousses."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g33": [
  {
   "id": "g33b",
   "titre": "Grille 33 · version 2",
   "niveau": "facile",
   "intention": "Quatre catégories du quotidien, sans piège.",
   "groupes": [
    {
     "categorie": "Mois",
     "difficulte": "facile",
     "mots": [
      "FÉVRIER",
      "AVRIL",
      "AOÛT",
      "DÉCEMBRE"
     ],
     "explication": "Quatre des douze mois."
    },
    {
     "categorie": "Vêtements du quotidien",
     "difficulte": "facile",
     "mots": [
      "PULL",
      "JUPE",
      "GILET",
      "BLOUSON"
     ],
     "explication": "Des vêtements de tous les jours."
    },
    {
     "categorie": "Moyens de transport",
     "difficulte": "facile",
     "mots": [
      "HÉLICOPTÈRE",
      "TÉLÉPHÉRIQUE",
      "SCOOTER",
      "AUTOCAR"
     ],
     "explication": "Pour se déplacer."
    },
    {
     "categorie": "Espaces de la maison",
     "difficulte": "facile",
     "mots": [
      "GARAGE",
      "CAVE",
      "COULOIR",
      "VÉRANDA"
     ],
     "explication": "Des parties de la maison."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g33c",
   "titre": "Grille 33 · version 3",
   "niveau": "facile",
   "intention": "Quatre catégories du quotidien, sans piège.",
   "groupes": [
    {
     "categorie": "Nombres",
     "difficulte": "facile",
     "mots": [
      "SEPT",
      "ONZE",
      "QUINZE",
      "VINGT"
     ],
     "explication": "Quatre nombres écrits en lettres."
    },
    {
     "categorie": "Petites bêtes du jardin",
     "difficulte": "facile",
     "mots": [
      "LOMBRIC",
      "PUCERON",
      "CLOPORTE",
      "MILLE-PATTES"
     ],
     "explication": "On les croise sous une pierre ou sur une feuille."
    },
    {
     "categorie": "À la plage",
     "difficulte": "facile",
     "mots": [
      "PARASOL",
      "TONGS",
      "SEAU",
      "MAILLOT"
     ],
     "explication": "Pour une journée au bord de la mer."
    },
    {
     "categorie": "Pays européens",
     "difficulte": "facile",
     "mots": [
      "AUTRICHE",
      "IRLANDE",
      "GRÈCE",
      "POLOGNE"
     ],
     "explication": "Quatre pays d'Europe."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g34": [
  {
   "id": "g34b",
   "titre": "Grille 34 · version 2",
   "niveau": "facile",
   "intention": "Une expression « carte de ___ » et trois catégories concrètes.",
   "groupes": [
    {
     "categorie": "Carte de ___",
     "difficulte": "intermediaire",
     "mots": [
      "CRÉDIT",
      "FIDÉLITÉ",
      "VŒUX",
      "MEMBRE"
     ],
     "explication": "Carte de crédit, carte de fidélité, carte de vœux, carte de membre."
    },
    {
     "categorie": "Dans l'espace",
     "difficulte": "facile",
     "mots": [
      "FUSÉE",
      "ASTRONAUTE",
      "GALAXIE",
      "ASTÉROÏDE"
     ],
     "explication": "Tout là-haut, au-delà du ciel."
    },
    {
     "categorie": "Au camping",
     "difficulte": "facile",
     "mots": [
      "GLACIÈRE",
      "CARAVANE",
      "DUVET",
      "HAMAC"
     ],
     "explication": "Pour les vacances en plein air."
    },
    {
     "categorie": "À la boulangerie",
     "difficulte": "facile",
     "mots": [
      "BRIOCHE",
      "CHAUSSON",
      "CHOUQUETTE",
      "TARTELETTE"
     ],
     "explication": "On les achète chez le boulanger."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g34c",
   "titre": "Grille 34 · version 3",
   "niveau": "facile",
   "intention": "Une expression « feu de ___ » et trois catégories concrètes.",
   "groupes": [
    {
     "categorie": "Feu de ___",
     "difficulte": "intermediaire",
     "mots": [
      "CHEMINÉE",
      "FORÊT",
      "DÉTRESSE",
      "BENGALE"
     ],
     "explication": "Feu de cheminée, feu de forêt, feu de détresse, feu de Bengale."
    },
    {
     "categorie": "Pour faire cuire",
     "difficulte": "facile",
     "mots": [
      "MARMITE",
      "WOK",
      "FAITOUT",
      "SAUTEUSE"
     ],
     "explication": "Quatre récipients de cuisson."
    },
    {
     "categorie": "Commerçants",
     "difficulte": "facile",
     "mots": [
      "FLEURISTE",
      "CHARCUTIER",
      "POISSONNIER",
      "FROMAGER"
     ],
     "explication": "Ils tiennent une boutique."
    },
    {
     "categorie": "Jouets",
     "difficulte": "facile",
     "mots": [
      "POUPÉE",
      "MARIONNETTE",
      "PANTIN",
      "HOCHET"
     ],
     "explication": "Pour jouer quand on est petit."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g35": [
  {
   "id": "g35b",
   "titre": "Grille 35 · version 2",
   "niveau": "facile",
   "intention": "Trois catégories directes, une expression connue.",
   "groupes": [
    {
     "categorie": "Fête des ___",
     "difficulte": "facile",
     "mots": [
      "MÈRES",
      "PÈRES",
      "VOISINS",
      "LUMIÈRES"
     ],
     "explication": "Fête des mères, fête des pères, fête des voisins, fête des Lumières (à Lyon)."
    },
    {
     "categorie": "Capitales",
     "difficulte": "facile",
     "mots": [
      "BERLIN",
      "LONDRES",
      "ATHÈNES",
      "VARSOVIE"
     ],
     "explication": "Les capitales de l'Allemagne, du Royaume-Uni, de la Grèce et de la Pologne."
    },
    {
     "categorie": "Jeux",
     "difficulte": "facile",
     "mots": [
      "MORPION",
      "PUZZLE",
      "LOTO",
      "BINGO"
     ],
     "explication": "Pour jouer seul ou à plusieurs."
    },
    {
     "categorie": "Outils du bricoleur",
     "difficulte": "facile",
     "mots": [
      "RABOT",
      "ÉTAU",
      "BURIN",
      "PONCEUSE"
     ],
     "explication": "Quatre outils de l'atelier."
    }
   ],
   "rattachements_plausibles": {}
  },
  {
   "id": "g35c",
   "titre": "Grille 35 · version 3",
   "niveau": "facile",
   "intention": "Trois catégories directes, une expression connue.",
   "groupes": [
    {
     "categorie": "___ de terre",
     "difficulte": "facile",
     "mots": [
      "VER",
      "TREMBLEMENT",
      "MOTTE",
      "ARMÉE"
     ],
     "explication": "Ver de terre, tremblement de terre, motte de terre, armée de terre."
    },
    {
     "categorie": "Félins sauvages",
     "difficulte": "facile",
     "mots": [
      "JAGUAR",
      "PUMA",
      "OCELOT",
      "SERVAL"
     ],
     "explication": "Quatre félins sauvages."
    },
    {
     "categorie": "Vêtements d'hiver",
     "difficulte": "facile",
     "mots": [
      "ANORAK",
      "PARKA",
      "MOUFLES",
      "CAGOULE"
     ],
     "explication": "Pour avoir chaud quand il fait froid."
    },
    {
     "categorie": "Parties d'un livre",
     "difficulte": "facile",
     "mots": [
      "CHAPITRE",
      "SOMMAIRE",
      "PRÉFACE",
      "RELIURE"
     ],
     "explication": "On les trouve dans un livre ou sur sa couverture."
    }
   ],
   "rattachements_plausibles": {}
  }
 ],
 "g36": [
  {
   "id": "g36b",
   "titre": "Grille 36 · version 2",
   "niveau": "intermediaire",
   "intention": "Une expression avec « avoir de la », un groupe « ils ont un noyau » qui mêle fruits et sciences ; CHARTREUX est un chat ou un moine.",
   "groupes": [
    {
     "categorie": "Avoir de la ___",
     "difficulte": "intermediaire",
     "mots": [
      "JUGEOTE",
      "CONVERSATION",
      "VEINE",
      "TENUE"
     ],
     "explication": "Avoir de la jugeote, avoir de la conversation, avoir de la veine, avoir de la tenue."
    },
    {
     "categorie": "Ils ont un noyau",
     "difficulte": "intermediaire",
     "mots": [
      "QUETSCHE",
      "BRUGNON",
      "ATOME",
      "CELLULE"
     ],
     "explication": "Le noyau de la quetsche et du brugnon… et celui de l'atome et de la cellule."
    },
    {
     "categorie": "Races de chats",
     "difficulte": "facile",
     "mots": [
      "SIAMOIS",
      "PERSAN",
      "CHARTREUX",
      "SPHYNX"
     ],
     "explication": "Quatre races de chats. Le chartreux est aussi un moine, mais les religieux sont déjà quatre."
    },
    {
     "categorie": "Membres d'un ordre religieux",
     "difficulte": "intermediaire",
     "mots": [
      "BÉNÉDICTIN",
      "TRAPPISTE",
      "FRANCISCAIN",
      "DOMINICAIN"
     ],
     "explication": "Des religieux de l'ordre de saint Benoît, de la Trappe, de saint François et de saint Dominique. Le chartreux aussi, mais il est pris par les chats."
    }
   ],
   "rattachements_plausibles": {
    "CHARTREUX": [
     "Membres d'un ordre religieux"
    ]
   }
  },
  {
   "id": "g36c",
   "titre": "Grille 36 · version 3",
   "niveau": "intermediaire",
   "intention": "Une expression avec « prendre le » ; MAQUIS se prend ou désigne une végétation ; un groupe « ils ont des piquants » qui mêle animaux et plantes.",
   "groupes": [
    {
     "categorie": "Prendre le ___",
     "difficulte": "intermediaire",
     "mots": [
      "LARGE",
      "FRAIS",
      "POULS",
      "MAQUIS"
     ],
     "explication": "Prendre le large, prendre le frais, prendre le pouls, prendre le maquis."
    },
    {
     "categorie": "Ils ont des piquants",
     "difficulte": "intermediaire",
     "mots": [
      "HÉRISSON",
      "ÉCHIDNÉ",
      "HOUX",
      "AUBÉPINE"
     ],
     "explication": "Le hérisson, l'échidné, le houx et l'aubépine piquent."
    },
    {
     "categorie": "Personnages de contes",
     "difficulte": "facile",
     "mots": [
      "CENDRILLON",
      "RAIPONCE",
      "BLANCHE-NEIGE",
      "BARBE-BLEUE"
     ],
     "explication": "Des héros de contes de Perrault et des frères Grimm."
    },
    {
     "categorie": "Types de végétation",
     "difficulte": "intermediaire",
     "mots": [
      "GARRIGUE",
      "LANDE",
      "STEPPE",
      "TOUNDRA"
     ],
     "explication": "Quatre formations végétales. Le maquis aussi, mais il est pris par « prendre le maquis »."
    }
   ],
   "rattachements_plausibles": {
    "MAQUIS": [
     "Types de végétation"
    ]
   }
  }
 ],
 "g37": [
  {
   "id": "g37b",
   "titre": "Grille 37 · version 2",
   "niveau": "intermediaire",
   "intention": "Deux mots pivots : ALTO (voix ou instrument) et MANDOLINE (instrument ou ustensile).",
   "groupes": [
    {
     "categorie": "Voix chantées",
     "difficulte": "intermediaire",
     "mots": [
      "SOPRANO",
      "TÉNOR",
      "BARYTON",
      "ALTO"
     ],
     "explication": "Quatre tessitures de chanteurs. L'alto est aussi un instrument à cordes, mais il faut quatre voix."
    },
    {
     "categorie": "Instruments à cordes",
     "difficulte": "intermediaire",
     "mots": [
      "MANDOLINE",
      "UKULÉLÉ",
      "BALALAÏKA",
      "BOUZOUKI"
     ],
     "explication": "Quatre instruments à cordes. La mandoline est aussi un ustensile, mais elle est prise ici."
    },
    {
     "categorie": "Ustensiles du cuisinier",
     "difficulte": "facile",
     "mots": [
      "ÉCONOME",
      "PRESSE-AIL",
      "ZESTEUR",
      "HACHOIR"
     ],
     "explication": "Ils servent en cuisine. La mandoline aussi, mais elle est prise par les instruments."
    },
    {
     "categorie": "Faire un ___",
     "difficulte": "intermediaire",
     "mots": [
      "TABAC",
      "BIDE",
      "FLOP",
      "TRIOMPHE"
     ],
     "explication": "Faire un tabac, faire un bide, faire un flop, faire un triomphe : réussir ou échouer."
    }
   ],
   "rattachements_plausibles": {
    "ALTO": [
     "Instruments à cordes"
    ],
    "MANDOLINE": [
     "Ustensiles du cuisinier"
    ]
   }
  },
  {
   "id": "g37c",
   "titre": "Grille 37 · version 3",
   "niveau": "intermediaire",
   "intention": "MORTIER est un matériau de maçon ou une arme ; CANON est une arme ou une pièce de fusil ; une expression avec « tenir le ».",
   "groupes": [
    {
     "categorie": "Matériaux du maçon",
     "difficulte": "intermediaire",
     "mots": [
      "CIMENT",
      "PLÂTRE",
      "BÉTON",
      "MORTIER"
     ],
     "explication": "Le maçon les utilise. Le mortier est aussi une pièce d'artillerie, mais il est pris ici."
    },
    {
     "categorie": "Armes à feu",
     "difficulte": "facile",
     "mots": [
      "FUSIL",
      "PISTOLET",
      "REVOLVER",
      "CARABINE"
     ],
     "explication": "Quatre armes à feu. Le mortier et le canon aussi, mais ils sont pris ailleurs."
    },
    {
     "categorie": "Pièces d'une arme à feu",
     "difficulte": "intermediaire",
     "mots": [
      "CANON",
      "CROSSE",
      "GÂCHETTE",
      "CULASSE"
     ],
     "explication": "Le canon, la crosse, la gâchette et la culasse d'un fusil. Le canon est aussi une arme, mais il faut quatre pièces."
    },
    {
     "categorie": "Tenir le ___",
     "difficulte": "intermediaire",
     "mots": [
      "COUP",
      "CHOC",
      "CRACHOIR",
      "CAP"
     ],
     "explication": "Tenir le coup, tenir le choc, tenir le crachoir, tenir le cap."
    }
   ],
   "rattachements_plausibles": {
    "MORTIER": [
     "Armes à feu"
    ],
    "CANON": [
     "Armes à feu"
    ]
   }
  }
 ],
 "g38": [
  {
   "id": "g38b",
   "titre": "Grille 38 · version 2",
   "niveau": "intermediaire",
   "intention": "BÛCHE sert à faire du feu ou se mange à Noël ; une expression familière avec « avoir les ».",
   "groupes": [
    {
     "categorie": "Avoir les ___ (familier)",
     "difficulte": "intermediaire",
     "mots": [
      "BOULES",
      "CHOCOTTES",
      "CROCS",
      "NERFS"
     ],
     "explication": "Avoir les boules, avoir les chocottes, avoir les crocs, avoir les nerfs."
    },
    {
     "categorie": "Pour faire un feu",
     "difficulte": "facile",
     "mots": [
      "ALLUMETTE",
      "BRINDILLE",
      "BRIQUET",
      "BÛCHE"
     ],
     "explication": "On s'en sert pour allumer ou entretenir un feu. La bûche est aussi un dessert, mais elle est prise ici."
    },
    {
     "categorie": "Desserts au chocolat",
     "difficulte": "intermediaire",
     "mots": [
      "FONDANT",
      "MARQUISE",
      "PROFITEROLES",
      "FORÊT-NOIRE"
     ],
     "explication": "Quatre desserts au chocolat. La bûche en est souvent un, mais elle est prise par le feu."
    },
    {
     "categorie": "Épreuves d'athlétisme",
     "difficulte": "facile",
     "mots": [
      "JAVELOT",
      "MARATHON",
      "HAIES",
      "DÉCATHLON"
     ],
     "explication": "Quatre épreuves d'athlétisme."
    }
   ],
   "rattachements_plausibles": {
    "BÛCHE": [
     "Desserts au chocolat"
    ]
   }
  },
  {
   "id": "g38c",
   "titre": "Grille 38 · version 3",
   "niveau": "intermediaire",
   "intention": "TON se donne ou désigne une teinte ; une expression avec « donner le ».",
   "groupes": [
    {
     "categorie": "Donner le ___",
     "difficulte": "intermediaire",
     "mots": [
      "CHANGE",
      "TON",
      "LA",
      "SIGNAL"
     ],
     "explication": "Donner le change, donner le ton, donner le la, donner le signal. Le ton est aussi une teinte, mais il est pris ici."
    },
    {
     "categorie": "Synonymes de couleur",
     "difficulte": "intermediaire",
     "mots": [
      "NUANCE",
      "TEINTE",
      "COLORIS",
      "TONALITÉ"
     ],
     "explication": "Quatre mots pour parler d'une couleur. Le ton aussi, mais il est pris par « donner le ton »."
    },
    {
     "categorie": "De la famille du chien",
     "difficulte": "intermediaire",
     "mots": [
      "CHACAL",
      "COYOTE",
      "FENNEC",
      "LYCAON"
     ],
     "explication": "Quatre canidés sauvages."
    },
    {
     "categorie": "Poissons d'eau douce",
     "difficulte": "facile",
     "mots": [
      "BROCHET",
      "SANDRE",
      "GARDON",
      "CARPE"
     ],
     "explication": "Ils vivent en rivière ou en étang."
    }
   ],
   "rattachements_plausibles": {
    "TON": [
     "Synonymes de couleur"
    ]
   }
  }
 ],
 "g39": [
  {
   "id": "g39b",
   "titre": "Grille 39 · version 2",
   "niveau": "intermediaire",
   "intention": "CLOCHE peut aller dans trois groupes ; seuls les chapeaux restent possibles une fois les autres complets. CARILLON hésite aussi.",
   "groupes": [
    {
     "categorie": "Chapeaux",
     "difficulte": "intermediaire",
     "mots": [
      "CANOTIER",
      "HAUT-DE-FORME",
      "CAPELINE",
      "CLOCHE"
     ],
     "explication": "Quatre chapeaux : la cloche est un chapeau de femme."
    },
    {
     "categorie": "Ils sonnent",
     "difficulte": "facile",
     "mots": [
      "RÉVEIL",
      "SONNETTE",
      "KLAXON",
      "CARILLON"
     ],
     "explication": "Ils font du bruit pour prévenir. La cloche aussi, mais elle est prise par les chapeaux."
    },
    {
     "categorie": "À l'église",
     "difficulte": "intermediaire",
     "mots": [
      "BÉNITIER",
      "CONFESSIONNAL",
      "VITRAIL",
      "CHAIRE"
     ],
     "explication": "On les trouve dans une église. La cloche et le carillon aussi, mais ils sont pris."
    },
    {
     "categorie": "Être au ___",
     "difficulte": "intermediaire",
     "mots": [
      "PARFUM",
      "TAQUET",
      "COURANT",
      "REGRET"
     ],
     "explication": "Être au parfum, être au taquet, être au courant, être au regret."
    }
   ],
   "rattachements_plausibles": {
    "CLOCHE": [
     "Ils sonnent",
     "À l'église"
    ],
    "CARILLON": [
     "À l'église"
    ]
   }
  },
  {
   "id": "g39c",
   "titre": "Grille 39 · version 3",
   "niveau": "intermediaire",
   "intention": "PIPEAU est un instrument ou un mensonge ; une expression avec « être dans la ».",
   "groupes": [
    {
     "categorie": "Être dans la ___",
     "difficulte": "intermediaire",
     "mots": [
      "LUNE",
      "PANADE",
      "MÉLASSE",
      "CONFIDENCE"
     ],
     "explication": "Être dans la lune, être dans la panade, être dans la mélasse, être dans la confidence."
    },
    {
     "categorie": "Mensonges, sornettes",
     "difficulte": "intermediaire",
     "mots": [
      "BOBARD",
      "CRAQUE",
      "BALIVERNE",
      "PIPEAU"
     ],
     "explication": "Un bobard, une craque, une baliverne, du pipeau : des choses fausses. Le pipeau est aussi une petite flûte, mais il est pris ici."
    },
    {
     "categorie": "Instruments où l'on souffle",
     "difficulte": "intermediaire",
     "mots": [
      "CLAIRON",
      "PICCOLO",
      "FIFRE",
      "BINIOU"
     ],
     "explication": "On souffle dedans pour jouer. Le pipeau aussi, mais il est pris par les mensonges."
    },
    {
     "categorie": "Châteaux célèbres",
     "difficulte": "facile",
     "mots": [
      "VERSAILLES",
      "CHAMBORD",
      "CHENONCEAU",
      "FONTAINEBLEAU"
     ],
     "explication": "Quatre châteaux français célèbres."
    }
   ],
   "rattachements_plausibles": {
    "PIPEAU": [
     "Instruments où l'on souffle"
    ]
   }
  }
 ],
 "g40": [
  {
   "id": "g40b",
   "titre": "Grille 40 · version 2",
   "niveau": "intermediaire",
   "intention": "La tête familière emprunte des mots au potager et au laboratoire : CITROUILLE et FIOLE sont les pivots.",
   "groupes": [
    {
     "categorie": "La tête, familièrement",
     "difficulte": "intermediaire",
     "mots": [
      "CABOCHE",
      "CIBOULOT",
      "CITROUILLE",
      "FIOLE"
     ],
     "explication": "Quatre mots familiers pour la tête (« se payer la fiole de quelqu'un »)."
    },
    {
     "categorie": "Courges",
     "difficulte": "facile",
     "mots": [
      "POTIMARRON",
      "PÂTISSON",
      "BUTTERNUT",
      "GIRAUMON"
     ],
     "explication": "Quatre courges. La citrouille en est une aussi, mais elle est prise."
    },
    {
     "categorie": "Verrerie de laboratoire",
     "difficulte": "intermediaire",
     "mots": [
      "ÉPROUVETTE",
      "PIPETTE",
      "BÉCHER",
      "BURETTE"
     ],
     "explication": "Le matériel en verre du chimiste. La fiole aussi, mais elle est prise par la tête."
    },
    {
     "categorie": "Rentrer dans le ___",
     "difficulte": "intermediaire",
     "mots": [
      "RANG",
      "LARD",
      "DÉCOR",
      "TAS"
     ],
     "explication": "Rentrer dans le rang, rentrer dans le lard, rentrer dans le décor, rentrer dans le tas."
    }
   ],
   "rattachements_plausibles": {
    "CITROUILLE": [
     "Courges"
    ],
    "FIOLE": [
     "Verrerie de laboratoire"
    ]
   }
  },
  {
   "id": "g40c",
   "titre": "Grille 40 · version 3",
   "niveau": "intermediaire",
   "intention": "Les chaussures familières et le cinéma prêtent leurs mots ailleurs : POMPES, GÉNÉRIQUE et SÉANCE sont les pivots.",
   "groupes": [
    {
     "categorie": "Chaussures, familièrement",
     "difficulte": "intermediaire",
     "mots": [
      "GODASSES",
      "GROLLES",
      "TATANES",
      "POMPES"
     ],
     "explication": "Quatre mots familiers pour les chaussures. Les pompes sont aussi un exercice, mais elles sont prises ici."
    },
    {
     "categorie": "À la salle de sport",
     "difficulte": "facile",
     "mots": [
      "ABDOS",
      "TRACTIONS",
      "GAINAGE",
      "FENTES"
     ],
     "explication": "Ce qu'on fait à la salle de sport. Les pompes et la séance aussi, mais elles sont prises."
    },
    {
     "categorie": "Au cinéma",
     "difficulte": "facile",
     "mots": [
      "POP-CORN",
      "BANDE-ANNONCE",
      "SÉANCE",
      "GÉNÉRIQUE"
     ],
     "explication": "Ce qu'on trouve au cinéma. La séance existe aussi à la salle de sport, et le générique à la pharmacie, mais ils sont pris ici."
    },
    {
     "categorie": "À la pharmacie",
     "difficulte": "facile",
     "mots": [
      "ORDONNANCE",
      "PANSEMENT",
      "COLLYRE",
      "SUPPOSITOIRE"
     ],
     "explication": "Un médicament générique aussi, mais le générique est pris par le cinéma."
    }
   ],
   "rattachements_plausibles": {
    "POMPES": [
     "À la salle de sport"
    ],
    "GÉNÉRIQUE": [
     "À la pharmacie"
    ],
    "SÉANCE": [
     "À la salle de sport"
    ]
   }
  }
 ],
 "g41": [
  {
   "id": "g41b",
   "titre": "Grille 41 · version 2",
   "niveau": "difficile",
   "intention": "Un groupe fondé sur les lettres (rangées dans l'ordre alphabétique) : FILOU, CHIOT et AGIOS ont chacun une catégorie tentante.",
   "groupes": [
    {
     "categorie": "Leurs lettres sont dans l'ordre alphabétique",
     "difficulte": "difficile",
     "mots": [
      "FILOU",
      "CHIOT",
      "AGIOS",
      "BIJOU"
     ],
     "explication": "F-I-L-O-U, C-H-I-O-T, A-G-I-O-S, B-I-J-O-U : chaque lettre vient après la précédente dans l'alphabet."
    },
    {
     "categorie": "Canailles",
     "difficulte": "intermediaire",
     "mots": [
      "FRIPOUILLE",
      "VAURIEN",
      "CHENAPAN",
      "GREDIN"
     ],
     "explication": "Quatre mauvais sujets. Le filou aussi, mais ses lettres sont dans l'ordre alphabétique."
    },
    {
     "categorie": "Petits d'animaux",
     "difficulte": "facile",
     "mots": [
      "LIONCEAU",
      "MARCASSIN",
      "OURSON",
      "LOUVETEAU"
     ],
     "explication": "Les petits du lion, du sanglier, de l'ours et du loup. Le chiot aussi, mais ses lettres sont dans l'ordre alphabétique."
    },
    {
     "categorie": "À la banque",
     "difficulte": "facile",
     "mots": [
      "DÉCOUVERT",
      "VIREMENT",
      "CHÉQUIER",
      "PRÊT"
     ],
     "explication": "Le vocabulaire de la banque. Les agios aussi, mais leurs lettres sont dans l'ordre alphabétique."
    }
   ],
   "rattachements_plausibles": {
    "FILOU": [
     "Canailles"
    ],
    "CHIOT": [
     "Petits d'animaux"
    ],
    "AGIOS": [
     "À la banque"
    ]
   }
  },
  {
   "id": "g41c",
   "titre": "Grille 41 · version 3",
   "niveau": "difficile",
   "intention": "Double sens : des villes de France qui sont aussi des noms communs. VANNES, VICHY, TULLE et COGNAC ont chacun une catégorie tentante.",
   "groupes": [
    {
     "categorie": "Sont aussi des villes de France",
     "difficulte": "difficile",
     "mots": [
      "VANNES",
      "VICHY",
      "TULLE",
      "COGNAC"
     ],
     "explication": "Vannes (Morbihan), Vichy (Allier), Tulle (Corrèze), Cognac (Charente)."
    },
    {
     "categorie": "Plaisanteries",
     "difficulte": "intermediaire",
     "mots": [
      "BLAGUE",
      "BOUTADE",
      "CALEMBOUR",
      "CANULAR"
     ],
     "explication": "Des vannes aussi, mais Vannes est une ville."
    },
    {
     "categorie": "Textiles",
     "difficulte": "intermediaire",
     "mots": [
      "FLANELLE",
      "TAFFETAS",
      "MOLLETON",
      "POPELINE"
     ],
     "explication": "Quatre tissus. Le vichy et le tulle aussi, mais ce sont des villes."
    },
    {
     "categorie": "Spiritueux",
     "difficulte": "facile",
     "mots": [
      "KIRSCH",
      "SCHNAPS",
      "MEZCAL",
      "OUZO"
     ],
     "explication": "Quatre alcools forts. Le cognac aussi, mais c'est une ville."
    }
   ],
   "rattachements_plausibles": {
    "VANNES": [
     "Plaisanteries"
    ],
    "VICHY": [
     "Textiles"
    ],
    "TULLE": [
     "Textiles"
    ],
    "COGNAC": [
     "Spiritueux"
    ]
   }
  }
 ],
 "g42": [
  {
   "id": "g42b",
   "titre": "Grille 42 · version 2",
   "niveau": "difficile",
   "intention": "Un groupe fondé sur les lettres (le A comme seule voyelle), dont chaque mot semble appartenir à une catégorie évidente.",
   "groupes": [
    {
     "categorie": "Le A est leur seule voyelle",
     "difficulte": "difficile",
     "mots": [
      "CANCAN",
      "LAMBADA",
      "CHAMAN",
      "BAZAR"
     ],
     "explication": "Cancan, lambada, chaman, bazar : aucune autre voyelle que le a."
    },
    {
     "categorie": "Ça se danse",
     "difficulte": "facile",
     "mots": [
      "TWIST",
      "BOLÉRO",
      "MAZURKA",
      "MENUET"
     ],
     "explication": "Quatre danses. Le cancan et la lambada aussi, mais ils n'ont que des a."
    },
    {
     "categorie": "Ils pratiquent la magie",
     "difficulte": "intermediaire",
     "mots": [
      "SORCIER",
      "MARABOUT",
      "DRUIDE",
      "MAGICIEN"
     ],
     "explication": "Le chaman aussi, mais il n'a que des a."
    },
    {
     "categorie": "Grand désordre",
     "difficulte": "intermediaire",
     "mots": [
      "FOUILLIS",
      "CHAOS",
      "PAGAILLE",
      "CAPHARNAÜM"
     ],
     "explication": "Le bazar aussi, mais il n'a que des a."
    }
   ],
   "rattachements_plausibles": {
    "CANCAN": [
     "Ça se danse"
    ],
    "LAMBADA": [
     "Ça se danse"
    ],
    "CHAMAN": [
     "Ils pratiquent la magie"
    ],
    "BAZAR": [
     "Grand désordre"
    ]
   }
  },
  {
   "id": "g42c",
   "titre": "Grille 42 · version 3",
   "niveau": "difficile",
   "intention": "Un groupe fondé sur les lettres (mots qui se lisent aussi à l'envers), dont chaque mot semble appartenir à une catégorie évidente.",
   "groupes": [
    {
     "categorie": "À l'envers, donnent un autre mot",
     "difficulte": "difficile",
     "mots": [
      "ÉMIR",
      "SNOB",
      "STOP",
      "ÉTAPE"
     ],
     "explication": "Émir → rime, snob → bons, stop → pots, étape → épate (accents mis à part)."
    },
    {
     "categorie": "Souverains",
     "difficulte": "intermediaire",
     "mots": [
      "SULTAN",
      "TSAR",
      "PHARAON",
      "MAHARADJA"
     ],
     "explication": "L'émir aussi, mais il donne « rime » à l'envers."
    },
    {
     "categorie": "Qui se croit supérieur",
     "difficulte": "intermediaire",
     "mots": [
      "HAUTAIN",
      "ARROGANT",
      "VANITEUX",
      "PRÉTENTIEUX"
     ],
     "explication": "Le snob aussi, mais il donne « bons » à l'envers."
    },
    {
     "categorie": "Arrêts",
     "difficulte": "facile",
     "mots": [
      "HALTE",
      "ESCALE",
      "PAUSE",
      "RÉPIT"
     ],
     "explication": "Le stop et l'étape aussi, mais ils donnent « pots » et « épate » à l'envers."
    }
   ],
   "rattachements_plausibles": {
    "ÉMIR": [
     "Souverains"
    ],
    "SNOB": [
     "Qui se croit supérieur"
    ],
    "STOP": [
     "Arrêts"
    ],
    "ÉTAPE": [
     "Arrêts"
    ]
   }
  }
 ],
 "g43": [
  {
   "id": "g43b",
   "titre": "Grille 43 · version 2",
   "niveau": "difficile",
   "intention": "Un groupe fondé sur les lettres : sans leur première lettre, ÉMULE, COURS, GLOTTE et ÉCAILLE deviennent des animaux ; trois ont une catégorie tentante.",
   "groupes": [
    {
     "categorie": "Sans leur première lettre, donnent un animal",
     "difficulte": "difficile",
     "mots": [
      "ÉMULE",
      "COURS",
      "GLOTTE",
      "ÉCAILLE"
     ],
     "explication": "éMULE, cOURS, gLOTTE, éCAILLE : la mule, l'ours, la lotte, la caille."
    },
    {
     "categorie": "Ceux qui suivent un maître",
     "difficulte": "intermediaire",
     "mots": [
      "DISCIPLE",
      "ADEPTE",
      "PARTISAN",
      "APÔTRE"
     ],
     "explication": "L'émule aussi, mais sans son é il donne une mule."
    },
    {
     "categorie": "À l'école",
     "difficulte": "facile",
     "mots": [
      "PUPITRE",
      "RÉCRÉATION",
      "DICTÉE",
      "BUVARD"
     ],
     "explication": "Le cours aussi, mais sans son c il donne un ours."
    },
    {
     "categorie": "Dans la gorge",
     "difficulte": "intermediaire",
     "mots": [
      "LARYNX",
      "PHARYNX",
      "AMYGDALES",
      "LUETTE"
     ],
     "explication": "La glotte aussi, mais sans son g elle donne une lotte."
    }
   ],
   "rattachements_plausibles": {
    "ÉMULE": [
     "Ceux qui suivent un maître"
    ],
    "COURS": [
     "À l'école"
    ],
    "GLOTTE": [
     "Dans la gorge"
    ]
   }
  },
  {
   "id": "g43c",
   "titre": "Grille 43 · version 3",
   "niveau": "difficile",
   "intention": "Mots cachés : un instrument de musique. MORGUE, INTUBATION, CHARPENTE et CORNICHE ont chacun une catégorie tentante.",
   "groupes": [
    {
     "categorie": "Cachent un instrument de musique",
     "difficulte": "difficile",
     "mots": [
      "MORGUE",
      "INTUBATION",
      "CHARPENTE",
      "CORNICHE"
     ],
     "explication": "mORGUE, inTUBAtion, cHARPEnte, CORniche : l'orgue, le tuba, la harpe, le cor."
    },
    {
     "categorie": "À l'hôpital",
     "difficulte": "intermediaire",
     "mots": [
      "URGENCES",
      "BRANCARD",
      "PERFUSION",
      "SCANNER"
     ],
     "explication": "La morgue et l'intubation aussi, mais elles cachent un orgue et un tuba."
    },
    {
     "categorie": "Toiture",
     "difficulte": "intermediaire",
     "mots": [
      "TUILE",
      "GOUTTIÈRE",
      "CHEVRON",
      "POUTRE"
     ],
     "explication": "La charpente et la corniche aussi, mais elles cachent une harpe et un cor."
    },
    {
     "categorie": "Pour pêcher",
     "difficulte": "facile",
     "mots": [
      "ÉPUISETTE",
      "NASSE",
      "CHALUT",
      "LEURRE"
     ],
     "explication": "Du matériel de pêche."
    }
   ],
   "rattachements_plausibles": {
    "MORGUE": [
     "À l'hôpital"
    ],
    "INTUBATION": [
     "À l'hôpital"
    ],
    "CHARPENTE": [
     "Toiture"
    ],
    "CORNICHE": [
     "Toiture"
    ]
   }
  }
 ],
 "g44": [
  {
   "id": "g44b",
   "titre": "Grille 44 · version 2",
   "niveau": "difficile",
   "intention": "Un groupe d'homophones (parties du corps) dont trois mots ont une catégorie tentante.",
   "groupes": [
    {
     "categorie": "Homophones d'une partie du corps",
     "difficulte": "difficile",
     "mots": [
      "JOUG",
      "PÔ",
      "COÛT",
      "POUSSE"
     ],
     "explication": "Joug / joue, Pô / peau, coût / cou, pousse / pouce."
    },
    {
     "categorie": "Fleuves d'Europe",
     "difficulte": "intermediaire",
     "mots": [
      "ELBE",
      "TIBRE",
      "MEUSE",
      "ODER"
     ],
     "explication": "Le Pô aussi, mais il se prononce comme « peau »."
    },
    {
     "categorie": "Ce que ça coûte",
     "difficulte": "facile",
     "mots": [
      "TARIF",
      "MONTANT",
      "FACTURE",
      "DOULOUREUSE"
     ],
     "explication": "La douloureuse, c'est l'addition, familièrement. Le coût aussi, mais il se prononce comme « cou »."
    },
    {
     "categorie": "Jeunes plantes",
     "difficulte": "intermediaire",
     "mots": [
      "GERME",
      "PLANT",
      "SEMIS",
      "BOUTURE"
     ],
     "explication": "La pousse aussi, mais elle se prononce comme « pouce »."
    }
   ],
   "rattachements_plausibles": {
    "PÔ": [
     "Fleuves d'Europe"
    ],
    "COÛT": [
     "Ce que ça coûte"
    ],
    "POUSSE": [
     "Jeunes plantes"
    ]
   }
  },
  {
   "id": "g44c",
   "titre": "Grille 44 · version 3",
   "niveau": "difficile",
   "intention": "Un groupe fondé sur les lettres : précédés d'un S, ORTIE, ANGLE, AVANT et ENTIER donnent un autre mot ; chacun a une catégorie tentante.",
   "groupes": [
    {
     "categorie": "Précédés d'un S, donnent un autre mot",
     "difficulte": "difficile",
     "mots": [
      "ORTIE",
      "ANGLE",
      "AVANT",
      "ENTIER"
     ],
     "explication": "Sortie, sangle, savant, sentier."
    },
    {
     "categorie": "Mauvaises herbes",
     "difficulte": "intermediaire",
     "mots": [
      "PISSENLIT",
      "CHIENDENT",
      "LISERON",
      "MOURON"
     ],
     "explication": "L'ortie aussi, mais avec un S elle devient une sortie."
    },
    {
     "categorie": "Au rugby",
     "difficulte": "intermediaire",
     "mots": [
      "PILIER",
      "TALONNEUR",
      "MÊLÉE",
      "AILIER"
     ],
     "explication": "Les avants aussi, mais avec un S, avant devient savant."
    },
    {
     "categorie": "En maths",
     "difficulte": "facile",
     "mots": [
      "FRACTION",
      "HYPOTÉNUSE",
      "DIAGONALE",
      "ÉQUATION"
     ],
     "explication": "L'angle et le nombre entier aussi, mais ils donnent sangle et sentier."
    }
   ],
   "rattachements_plausibles": {
    "ORTIE": [
     "Mauvaises herbes"
    ],
    "AVANT": [
     "Au rugby"
    ],
    "ANGLE": [
     "En maths"
    ],
    "ENTIER": [
     "En maths"
    ]
   }
  }
 ],
 "g45": [
  {
   "id": "g45b",
   "titre": "Grille 45 · version 2",
   "niveau": "difficile",
   "intention": "Un groupe fondé sur le début du mot (un oiseau), dont trois mots semblent appartenir à une catégorie gourmande évidente.",
   "groupes": [
    {
     "categorie": "Commencent par un oiseau",
     "difficulte": "difficile",
     "mots": [
      "COQUILLETTE",
      "CANELÉ",
      "PICODON",
      "MILANAISE"
     ],
     "explication": "COQuillette, CANElé, PICodon, MILANaise : le coq, la cane, le pic, le milan."
    },
    {
     "categorie": "Variétés de pâtes",
     "difficulte": "facile",
     "mots": [
      "LINGUINE",
      "TORTELLINI",
      "PAPPARDELLE",
      "ORECCHIETTE"
     ],
     "explication": "Quatre pâtes italiennes. Les coquillettes aussi, mais elles commencent par un coq."
    },
    {
     "categorie": "Fromages de chèvre",
     "difficulte": "intermediaire",
     "mots": [
      "CROTTIN",
      "PÉLARDON",
      "VALENÇAY",
      "CHABICHOU"
     ],
     "explication": "Quatre fromages de chèvre. Le picodon aussi, mais il commence par un pic."
    },
    {
     "categorie": "Douceurs régionales",
     "difficulte": "intermediaire",
     "mots": [
      "KOUGLOF",
      "NAVETTE",
      "BUGNE",
      "TROPÉZIENNE"
     ],
     "explication": "Le kouglof d'Alsace, la navette de Marseille, la bugne lyonnaise, la tarte tropézienne. Le canelé de Bordeaux aussi, mais il commence par une cane."
    }
   ],
   "rattachements_plausibles": {
    "COQUILLETTE": [
     "Variétés de pâtes"
    ],
    "PICODON": [
     "Fromages de chèvre"
    ],
    "CANELÉ": [
     "Douceurs régionales"
    ]
   }
  },
  {
   "id": "g45c",
   "titre": "Grille 45 · version 3",
   "niveau": "difficile",
   "intention": "Mots cachés : un cours d'eau. GLOIRE, RAYONNEMENT, CHENIL et OTAGE ont chacun une catégorie tentante.",
   "groupes": [
    {
     "categorie": "Cachent un cours d'eau",
     "difficulte": "difficile",
     "mots": [
      "GLOIRE",
      "RAYONNEMENT",
      "CHENIL",
      "OTAGE"
     ],
     "explication": "gLOIRE, raYONNEment, cheNIL, oTAGE : la Loire, l'Yonne, le Nil, le Tage."
    },
    {
     "categorie": "Le fait d'être connu",
     "difficulte": "intermediaire",
     "mots": [
      "CÉLÉBRITÉ",
      "NOTORIÉTÉ",
      "PRESTIGE",
      "RENOMMÉE"
     ],
     "explication": "La gloire et le rayonnement aussi, mais ils cachent la Loire et l'Yonne."
    },
    {
     "categorie": "Abris pour animaux",
     "difficulte": "facile",
     "mots": [
      "TERRIER",
      "CLAPIER",
      "ÉCURIE",
      "BERGERIE"
     ],
     "explication": "Le chenil aussi, mais il cache le Nil."
    },
    {
     "categorie": "Privés de liberté",
     "difficulte": "intermediaire",
     "mots": [
      "PRISONNIER",
      "DÉTENU",
      "CAPTIF",
      "BAGNARD"
     ],
     "explication": "L'otage aussi, mais il cache le Tage."
    }
   ],
   "rattachements_plausibles": {
    "GLOIRE": [
     "Le fait d'être connu"
    ],
    "RAYONNEMENT": [
     "Le fait d'être connu"
    ],
    "CHENIL": [
     "Abris pour animaux"
    ],
    "OTAGE": [
     "Privés de liberté"
    ]
   }
  }
 ]
};
