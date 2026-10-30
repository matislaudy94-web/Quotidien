"""Génère /home/claude/quotidien/expressions.json (banque du mini-jeu « Expression mystère »)."""
import json, os

E = []
def x(diff, cat, texte, mot, indice, leurres, sens, exemple, variantes=()):
    E.append({"id": f"x{len(E)+1:03d}", "difficulte": diff, "categorie": cat, "texte": texte, "mot": mot,
              "complete": texte.replace("___", mot.lower()), "indice": indice, "leurres": list(leurres),
              "sens": sens, "exemple": exemple, "variantes": list(variantes)})

# ---------- FACILES (20) ----------
x("facile", "corps", "Avoir le cœur sur la ___", "MAIN",
  "Se dit d'une personne très généreuse.", ["JOUE", "TÊTE", "PEAU"],
  "Être généreux, toujours prêt à donner ou à rendre service sans rien attendre en retour.",
  "Elle a le cœur sur la main : elle a prêté sa voiture à un voisin qu'elle connaît à peine.")
x("facile", "animaux", "Poser un ___", "LAPIN",
  "Se dit quand on ne vient pas à un rendez-vous, sans prévenir.", ["LIÈVRE", "RENARD", "HÉRISSON"],
  "Ne pas venir à un rendez-vous convenu, sans prévenir, en laissant l'autre attendre pour rien.",
  "Il m'a posé un lapin : je l'ai attendu une heure devant le cinéma.")
x("facile", "quotidien", "Il pleut des ___", "CORDES",
  "Se dit quand la pluie tombe très fort.", ["FICELLES", "RUBANS", "CHAÎNES"],
  "Il pleut très fort, à verse : la pluie tombe dense, drue et sans interruption.",
  "Prends un parapluie, il pleut des cordes depuis ce matin.")
x("facile", "animaux", "Être muet comme une ___", "CARPE",
  "Se dit de quelqu'un qui ne dit pas un seul mot.", ["TRUITE", "SOLE", "PERCHE"],
  "Rester complètement silencieux, ne pas prononcer un mot, par timidité, par prudence ou par refus de parler.",
  "Interrogé par ses parents, il est resté muet comme une carpe.")
x("facile", "animaux", "Quand les ___ auront des dents", "POULES",
  "Se dit d'une chose qui n'arrivera jamais.", ["OIES", "CANES", "DINDES"],
  "Jamais : se dit pour affirmer qu'une chose est impossible ou n'arrivera sans doute jamais.",
  "Lui, arriver à l'heure ? Quand les poules auront des dents !")
x("facile", "nourriture", "Avoir une faim de ___", "LOUP",
  "Se dit quand on est affamé.", ["TIGRE", "RENARD", "SANGLIER"],
  "Avoir très faim, être affamé au point de pouvoir avaler un repas énorme.",
  "Après la randonnée, on avait tous une faim de loup.")
x("facile", "corps", "Prendre ses ___ à son cou", "JAMBES",
  "Se dit quand on s'enfuit en courant à toute vitesse.", ["BRAS", "MAINS", "GENOUX"],
  "S'enfuir très vite, partir en courant le plus rapidement possible, souvent sous l'effet de la peur.",
  "En entendant le chien aboyer, le cambrioleur a pris ses jambes à son cou.")
x("facile", "travail", "Avoir du ___ sur la planche", "PAIN",
  "Se dit quand beaucoup de travail nous attend.", ["JAMBON", "SAUCISSON", "GRUYÈRE"],
  "Avoir beaucoup de travail à faire, une longue liste de tâches qui attendent d'être accomplies.",
  "Avec ce déménagement à préparer, on a du pain sur la planche.")
x("facile", "travail", "Avoir un ___ dans la main", "POIL",
  "Se dit d'une personne paresseuse.", ["CLOU", "GRAIN", "CHEVEU"],
  "Être paresseux, ne pas aimer l'effort et éviter de travailler autant que possible.",
  "Il n'a pas levé le petit doigt pour nous aider : il a un poil dans la main.")
x("facile", "nourriture", "Raconter des ___", "SALADES",
  "Se dit quand quelqu'un ment ou invente des histoires.", ["CAROTTES", "BETTERAVES", "ENDIVES"],
  "Mentir, raconter des histoires inventées ou des boniments pour tromper quelqu'un ou se justifier.",
  "Arrête de me raconter des salades, je sais très bien où tu étais.")
x("facile", "nourriture", "C'est la cerise sur le ___", "GÂTEAU",
  "Se dit d'un petit plus qui vient couronner une chose déjà réussie.", ["FLAN", "BISCUIT", "CLAFOUTIS"],
  "Le petit détail en plus qui vient parfaire une chose déjà réussie (se dit aussi, par ironie, d'un ennui de plus).",
  "Le séjour était parfait, et la chambre avec terrasse, c'était la cerise sur le gâteau.")
x("facile", "emotions", "Ne pas être dans son ___", "ASSIETTE",
  "Se dit quand on ne se sent pas bien, physiquement ou moralement.", ["BOL", "PLAT", "PANIER"],
  "Ne pas se sentir bien : être un peu malade, fatigué ou mal à l'aise, pas dans son état habituel.",
  "Tu as l'air pâle, tu n'es pas dans ton assiette aujourd'hui ?")
x("facile", "emotions", "Être aux ___", "ANGES",
  "Se dit quand on est extrêmement heureux.", ["SAINTS", "APÔTRES", "PROPHÈTES"],
  "Être ravi, comblé, dans un état de grande joie ou de parfait contentement.",
  "Depuis qu'elle a reçu la nouvelle, elle est aux anges.")
x("facile", "chance", "Croiser les ___", "DOIGTS",
  "Geste ou formule pour souhaiter que tout se passe bien.", ["ORTEILS", "POIGNETS", "COUDES"],
  "Espérer très fort qu'une chose se passe bien, en faisant le geste ou en le disant pour conjurer le mauvais sort.",
  "Je passe mon entretien demain, croise les doigts pour moi !")
x("facile", "chance", "Toucher du ___", "BOIS",
  "Formule superstitieuse dite après avoir évoqué quelque chose de positif.", ["FER", "VERRE", "MARBRE"],
  "Formule dite pour conjurer le mauvais sort, souvent juste après s'être félicité d'une situation favorable.",
  "Je n'ai jamais eu d'accident de voiture, je touche du bois.")
x("facile", "imagees", "Tourner autour du ___", "POT",
  "Se dit quand on hésite à dire franchement les choses.", ["PLAT", "BOL", "SEAU"],
  "Parler de manière détournée, hésiter à aborder directement un sujet au lieu de dire clairement les choses.",
  "Arrête de tourner autour du pot et dis-moi ce qui ne va pas.")
x("facile", "quotidien", "Les murs ont des ___", "OREILLES",
  "Mise en garde : quelqu'un pourrait entendre ce qu'on dit.", ["BOUCHES", "LÈVRES", "ANTENNES"],
  "Il faut rester discret, car on peut être écouté sans le savoir, même quand on se croit à l'abri des indiscrets.",
  "Parle moins fort, les murs ont des oreilles dans cet open space.")
x("facile", "imagees", "Être dans la ___", "LUNE",
  "Se dit d'une personne distraite, rêveuse.", ["GALAXIE", "STRATOSPHÈRE", "NÉBULEUSE"],
  "Être distrait, rêveur, avoir l'esprit ailleurs sans prêter attention à ce qui se passe autour de soi.",
  "Excuse-moi, j'étais dans la lune, tu peux répéter ta question ?")
x("facile", "quotidien", "Avoir un ___ de retard", "TRAIN",
  "Se dit de quelqu'un qui n'est pas au courant ou comprend après les autres.", ["BATEAU", "VÉLO", "TAXI"],
  "Être en retard sur les autres : ne pas connaître les dernières nouvelles ou comprendre une situation après tout le monde.",
  "Tu ne savais pas qu'ils avaient déménagé ? Tu as un train de retard !")
x("facile", "quotidien", "Revenir à ses ___", "MOUTONS",
  "Se dit quand on reprend le sujet principal après une digression.", ["CHÈVRES", "VACHES", "COCHONS"],
  "Reprendre le sujet dont on parlait avant de s'en écarter, revenir à l'essentiel après une digression.",
  "Bon, revenons à nos moutons : qui s'occupe des réservations ?")

# ---------- INTERMÉDIAIRES (20) ----------
x("intermediaire", "quotidien", "Avoir la ___ de bois", "GUEULE",
  "Se dit au lendemain d'une soirée trop arrosée.", ["BOUCHE", "MINE", "NUQUE"],
  "Se sentir mal (migraine, nausée, fatigue) au lendemain d'un excès d'alcool. Expression familière.",
  "Après le pot de départ d'hier soir, il avait la gueule de bois toute la matinée.")
x("intermediaire", "quotidien", "Être serrés comme des ___", "SARDINES",
  "Se dit quand on est très nombreux dans un espace trop petit.", ["ANCHOIS", "HARENGS", "THONS"],
  "Être entassés à plusieurs dans un espace trop étroit, collés les uns aux autres, comme dans un métro bondé.",
  "À l'heure de pointe, on est serrés comme des sardines dans le RER.")
x("intermediaire", "nourriture", "En faire tout un ___", "FROMAGE",
  "Se dit quand quelqu'un exagère l'importance d'une petite chose.", ["YAOURT", "DESSERT", "GRATIN"],
  "Exagérer l'importance d'un détail, faire toute une histoire pour une chose sans gravité.",
  "Ce n'est qu'une petite rayure sur la voiture, pas la peine d'en faire tout un fromage.")
x("intermediaire", "emotions", "Broyer du ___", "NOIR",
  "Se dit de quelqu'un qui a des idées tristes, qui déprime.", ["GRIS", "BLANC", "VIOLET"],
  "Être triste, mélancolique, ressasser des pensées sombres et voir l'avenir sous son plus mauvais jour.",
  "Depuis sa rupture, il reste enfermé chez lui à broyer du noir.")
x("intermediaire", "chance", "Être né sous une bonne ___", "ÉTOILE",
  "Se dit d'une personne qui a toujours été favorisée par le sort.", ["PLANÈTE", "COMÈTE", "CONSTELLATION"],
  "Avoir de la chance dans la vie, être favorisé par le sort comme si un destin heureux veillait sur soi.",
  "Il gagne à presque toutes les tombolas : il est vraiment né sous une bonne étoile.")
x("intermediaire", "travail", "Mettre des bâtons dans les ___", "ROUES",
  "Se dit quand on fait exprès de gêner les projets de quelqu'un.", ["PNEUS", "PÉDALES", "JANTES"],
  "Créer volontairement des obstacles pour gêner quelqu'un ou empêcher un projet d'avancer.",
  "Le service juridique nous met des bâtons dans les roues depuis le début du projet.")
x("intermediaire", "imagees", "Prendre le taureau par les ___", "CORNES",
  "Se dit quand on affronte une difficulté avec courage, sans se dérober.", ["SABOTS", "NASEAUX", "FLANCS"],
  "Affronter résolument une difficulté, s'attaquer directement à un problème au lieu de l'éviter.",
  "Plutôt que d'attendre, elle a pris le taureau par les cornes et appelé son banquier.")
x("intermediaire", "imagees", "Avoir une araignée au ___", "PLAFOND",
  "Se dit de quelqu'un d'un peu fou ou farfelu.", ["BALCON", "PLANCHER", "CELLIER"],
  "Être un peu dérangé, avoir des idées bizarres ou farfelues ; se dit d'une personne qui semble un peu folle.",
  "Il parle à ses plantes en chantant : il a une araignée au plafond, ton voisin !")
x("intermediaire", "animaux", "Il y a ___ sous roche", "ANGUILLE",
  "Se dit quand on soupçonne qu'une chose est cachée.", ["TRUITE", "LIMACE", "COULEUVRE"],
  "Il se passe quelque chose de caché ou de suspect ; on soupçonne qu'une affaire n'est pas aussi simple qu'elle paraît.",
  "Ils se taisent dès que j'entre dans la pièce : il y a anguille sous roche.")
x("intermediaire", "corps", "Tirer les ___ du nez", "VERS",
  "Se dit quand on fait avouer peu à peu un secret à quelqu'un.", ["CLOUS", "POILS", "GRAINS"],
  "Obtenir d'une personne, à force de questions habiles, des informations ou un secret qu'elle ne voulait pas révéler.",
  "Elle a fini par lui tirer les vers du nez : il a avoué où il avait caché les cadeaux.")
x("intermediaire", "nourriture", "Mettre du ___ dans les épinards", "BEURRE",
  "Se dit d'un revenu en plus qui améliore le quotidien.", ["SEL", "SUCRE", "POIVRE"],
  "Améliorer sa situation financière, gagner un peu plus d'argent pour rendre la vie plus confortable.",
  "Ses cours particuliers du samedi mettent du beurre dans les épinards.")
x("intermediaire", "travail", "Avoir les dents qui rayent le ___", "PARQUET",
  "Se dit d'une personne très ambitieuse, prête à tout pour réussir.", ["CARRELAGE", "LINOLÉUM", "BITUME"],
  "Être extrêmement ambitieux, prêt à tout pour réussir ou monter en grade, quitte à écraser les autres.",
  "Le nouveau stagiaire a les dents qui rayent le parquet : il vise déjà le poste de sa cheffe.")
x("intermediaire", "corps", "Être sur les ___", "ROTULES",
  "Se dit quand on est épuisé.", ["CHEVILLES", "HANCHES", "CLAVICULES"],
  "Être épuisé, à bout de forces, après un gros effort ou une longue période de fatigue. Expression familière.",
  "Après ce déménagement, je suis sur les rotules.")
x("intermediaire", "chance", "Passer entre les ___", "GOUTTES",
  "Se dit quand on échappe de justesse à un ennui qui touche les autres.", ["NUAGES", "FLAQUES", "ÉCLAIRS"],
  "Échapper de justesse à un danger, à une sanction ou à un ennui qui frappe les autres autour de soi.",
  "Tout le service a eu la grippe, mais moi je suis passé entre les gouttes.")
x("intermediaire", "chance", "Avoir le vent en ___", "POUPE",
  "Se dit quand tout réussit, quand on enchaîne les succès.", ["PROUE", "QUILLE", "CABINE"],
  "Être dans une période favorable, réussir et progresser facilement, aidé par les circonstances.",
  "Avec ses deux nouvelles boutiques, la jeune marque a le vent en poupe.")
x("intermediaire", "emotions", "Monter sur ses grands ___", "CHEVAUX",
  "Se dit quand quelqu'un s'emporte et répond avec hauteur.", ["MULETS", "PONEYS", "ÉTALONS"],
  "S'emporter, se mettre en colère et répondre avec hauteur, en prenant un ton offensé ou supérieur.",
  "Dès qu'on critique son projet, il monte sur ses grands chevaux.")
x("intermediaire", "emotions", "Être soupe au ___", "LAIT",
  "Se dit d'une personne qui s'emporte vite, mais se calme aussi vite.", ["MIEL", "RIZ", "CHOCOLAT"],
  "Être prompt à s'emporter : se mettre en colère très vite pour peu de chose, puis se calmer aussi rapidement.",
  "Ne le prends pas mal, mon père est un peu soupe au lait.")
x("intermediaire", "travail", "Tirer son ___ du jeu", "ÉPINGLE",
  "Se dit quand on se sort habilement d'une situation délicate.", ["AIGUILLE", "AGRAFE", "ÉPÉE"],
  "Se sortir adroitement d'une situation difficile ou compliquée, en limitant les pertes ou en en retirant un avantage.",
  "Malgré la crise, cette petite entreprise a su tirer son épingle du jeu.")
x("intermediaire", "animaux", "Vendre la peau de l'___ avant de l'avoir tué", "OURS",
  "Se dit quand on se réjouit d'un succès qui n'est pas encore acquis.", ["ÉLAN", "AIGLE", "ÉLÉPHANT"],
  "Se réjouir trop tôt, considérer comme acquis un résultat ou un gain qu'on n'a pas encore obtenu.",
  "Le contrat n'est pas signé : ne vendons pas la peau de l'ours avant de l'avoir tué.")
x("intermediaire", "nourriture", "Mi-figue, mi-___", "RAISIN",
  "Se dit d'un accueil ou d'un avis partagé, entre satisfaction et mécontentement.", ["POIRE", "PRUNE", "CERISE"],
  "Ni tout à fait bon ni tout à fait mauvais : qui mêle satisfaction et mécontentement, ou sérieux et plaisanterie.",
  "Sa proposition a reçu un accueil mi-figue, mi-raisin.")

# ---------- DIFFICILES (10) ----------
x("difficile", "difficiles", "Avoir maille à ___", "PARTIR",
  "Se dit quand on a un différend ou des démêlés avec quelqu'un.", ["SORTIR", "VENIR", "FINIR"],
  "Avoir un différend, une dispute ou des démêlés avec quelqu'un (ou avec une administration, la justice…).",
  "Il a eu maille à partir avec son propriétaire au sujet de la caution.")
x("difficile", "difficiles", "Avoir l'___ de l'escalier", "ESPRIT",
  "Se dit de quelqu'un qui trouve la bonne réplique trop tard.", ["ÉCHO", "ÉLAN", "ŒIL"],
  "Trouver la réplique parfaite ou la bonne réponse trop tard, une fois la conversation terminée.",
  "J'ai eu l'esprit de l'escalier : la réponse idéale m'est venue une fois rentré chez moi.")
x("difficile", "difficiles", "Faire amende ___", "HONORABLE",
  "Se dit quand on reconnaît ses torts et qu'on s'en excuse.", ["VÉRITABLE", "RESPECTABLE", "CONVENABLE"],
  "Reconnaître ses torts, admettre publiquement qu'on s'est trompé et présenter ses excuses.",
  "Après sa remarque déplacée, l'animateur a fait amende honorable devant les téléspectateurs.")
x("difficile", "imagees", "Tirer des ___ sur la comète", "PLANS",
  "Se dit quand on fait des projets irréalistes sur un avenir incertain.", ["TRAITS", "FLÈCHES", "BALLES"],
  "Faire des projets chimériques, échafauder des espoirs sur un avenir très incertain, sans base solide.",
  "Tant qu'on n'a pas l'accord de la banque, inutile de tirer des plans sur la comète pour la déco.")
x("difficile", "travail", "Avoir voix au ___", "CHAPITRE",
  "Se dit quand on a le droit d'être consulté dans une décision.", ["COUPLET", "REFRAIN", "PARAGRAPHE"],
  "Avoir le droit de s'exprimer et d'être consulté, avoir son mot à dire dans une discussion ou une décision.",
  "Les stagiaires n'ont pas voix au chapitre lors des réunions budgétaires.")
x("difficile", "emotions", "Se faire du ___", "MOURON",
  "Se dit quand on s'inquiète beaucoup pour quelque chose ou quelqu'un.", ["PERSIL", "CRESSON", "THYM"],
  "Se faire beaucoup de souci, s'inquiéter, se tourmenter pour quelqu'un ou pour quelque chose. Expression familière.",
  "Ne te fais pas de mouron, elle a juste oublié de charger son téléphone.")
x("difficile", "difficiles", "Prêcher pour sa ___", "PAROISSE",
  "Se dit de quelqu'un qui défend avant tout ses propres intérêts.", ["CATHÉDRALE", "BASILIQUE", "MAIRIE"],
  "Défendre ses propres intérêts ou ceux de son camp, tout en ayant l'air de donner un avis neutre.",
  "Quand le vendeur vante cette extension de garantie, il prêche un peu pour sa paroisse.")
x("difficile", "travail", "Graisser la ___", "PATTE",
  "Se dit quand on soudoie quelqu'un pour obtenir une faveur.", ["POIGNE", "NUQUE", "CHEVILLE"],
  "Donner discrètement de l'argent à quelqu'un pour obtenir un avantage ou une faveur, autrement dit le soudoyer.",
  "Il a graissé la patte au portier pour entrer sans billet.")
x("difficile", "travail", "Peigner la ___", "GIRAFE",
  "Se dit quand on perd son temps à une tâche inutile.", ["GAZELLE", "LIONNE", "CHÈVRE"],
  "Faire un travail long et inutile, ou ne rien faire d'efficace ; perdre son temps à des riens.",
  "Pendant que nous bouclions le dossier, lui peignait la girafe.")
x("difficile", "quotidien", "Être réglé comme du papier à ___", "MUSIQUE",
  "Se dit d'une chose ou d'une personne extrêmement régulière.", ["LETTRES", "DESSIN", "CIGARETTE"],
  "Être parfaitement régulier, organisé et prévisible ; se dérouler exactement comme prévu, sans la moindre surprise.",
  "Tous les matins à 7 h, il promène son chien : c'est réglé comme du papier à musique.")

assert len(E) == 50
out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "expressions.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump({"version": 1, "expressions": E}, f, ensure_ascii=False, indent=1)
    f.write("\n")
print("écrit", out, len(E))
