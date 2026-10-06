
from sqlmodel import Session

from app.db.session import engine
from app.models.establishment import Establishment


ESTABLISHMENT_DESCRIPTIONS = {
    17: (
        "Le Collège Moderne Bilingue de Yaoundé prépare au BEPC, au "
        "Baccalauréat et au GCE Ordinary Level, en français comme en anglais. "
        "Concrètement : deux sections distinctes, des professeurs différents "
        "pour chacune, et un emploi du temps qui ne mélange pas les élèves "
        "francophones et anglophones, sauf pour le sport et certaines "
        "activités.\n\n"
        "L'établissement accueille de la sixième à la Terminale, en séries "
        "Lettres et sciences humaines ou Sciences pures. Les effectifs restent "
        "raisonnables, et chaque trimestre se termine par un conseil de classe "
        "où les cas difficiles sont examinés un par un.\n\n"
        "Côté vie scolaire : une bibliothèque ouverte toute la journée, y "
        "compris pendant les périodes d'examens, et un internat pour les "
        "élèves dont les familles habitent loin. Étude obligatoire le soir, "
        "sorties encadrées le week-end.\n\n"
        "Frais annuels : de 55 000 à 85 000 FCFA selon la classe, payables en "
        "banque. Le reçu est à présenter au secrétariat avant la rentrée. "
        "Pour l'inscription, passez au bureau du proviseur avec le bulletin "
        "de l'année précédente ; c'est le moyen le plus rapide d'avoir une "
        "réponse."
    ),
    18: (
        "Le Lycée Technique Industriel de Bafoussam est un établissement "
        "public francophone. Ici, on ne fait pas que des cours : une grosse "
        "partie du travail se passe dans les ateliers, outils en main. Deux "
        "filières : génie civil et BTP d'un côté, génie électrique de "
        "l'autre.\n\n"
        "Le parcours est complet. Un élève entre au lycée, passe son CAP, "
        "continue vers le Probatoire technique puis termine par un BTS. Peu "
        "d'établissements de la région offrent cette continuité, et beaucoup "
        "d'anciens reviennent d'ailleurs faire leur BTS chez nous après un "
        "premier emploi.\n\n"
        "Les ateliers couvrent la menuiserie métallique, l'électricité "
        "bâtiment, la soudure et la maçonnerie. Les professeurs de pratique "
        "viennent du terrain et exigent le port des équipements de "
        "protection, sans exception.\n\n"
        "Frais de scolarité : entre 40 000 et 70 000 FCFA par an selon la "
        "filière, payables en début d'année. Le proviseur peut accorder des "
        "facilités aux familles qui en font la demande. Inscriptions au "
        "secrétariat du lycée, à Bafoussam, région de l'Ouest."
    ),
    19: (
        "L'ISIT est un institut supérieur francophone basé à Douala. Il "
        "forme en Licence et Master dans deux domaines seulement, mais il "
        "les prend au sérieux : informatique et génie logiciel d'un côté, "
        "génie civil et BTP de l'autre. Pas de vingt filières différentes, "
        "donc pas de classes surchargées ni de moyens dispersés.\n\n"
        "Les cours alternent théorie et pratique. Les informaticiens "
        "travaillent sur des projets réels dès la deuxième année ; les "
        "futurs ingénieurs civils passent une bonne partie de leur temps sur "
        "des calculs de structures et des visites de chantier organisées par "
        "l'institut.\n\n"
        "La bibliothèque numérique reste accessible même hors campus, ce qui "
        "aide beaucoup pendant les périodes de mémoire. Les laboratoires "
        "servent chaque semaine, pas seulement pour les photos de la "
        "rentrée.\n\n"
        "Comptez entre 1 500 000 et 2 000 000 FCFA par an, payables en "
        "plusieurs tranches contre reçu. L'institut se trouve à Douala, "
        "région du Littoral, à quelques minutes des entreprises où nos "
        "étudiants font leurs stages."
    ),
    20: (
        "Groupe Scolaire Les Palmiers, Douala. Maternelle et primaire, "
        "section française et section anglaise, sur le même terrain. Les "
        "petits de la Petite Section apprennent en jouant ; ceux du CM2 "
        "préparent le CEP sérieusement, avec des devoirs surveillés "
        "réguliers.\n\n"
        "Ce que les parents demandent souvent : oui, la cantine prépare les "
        "repas sur place et le menu de la semaine est affiché lundi matin. "
        "Oui, le bus scolaire dessert les principaux quartiers, avec un "
        "accompagnateur dans chaque véhicule. Et non, les effectifs ne sont "
        "pas gonflés : chaque maître connaît le nom de tous ses élèves, et "
        "les bulletins partent avec un mot personnel.\n\n"
        "L'école prépare au CEP comme à son équivalent anglais, et les "
        "taux de réussite sont affichés chaque année à l'entrée "
        "principale.\n\n"
        "Frais annuels entre 100 000 et 170 000 FCFA selon la classe. "
        "Inscriptions au secrétariat, avec le carnet de vaccination pour les "
        "plus petits. Vous êtes les bienvenus pour visiter avant de "
        "décider."
    ),
    21: (
        "L'Université Privée du Nord se trouve à Garoua. Elle forme en "
        "Licence et Master, en français comme en anglais, dans deux "
        "filières : informatique et génie logiciel, sciences économiques et "
        "de gestion.\n\n"
        "Pourquoi ces deux choix ? Parce que ce sont les compétences que la "
        "région demande aujourd'hui, ni plus ni moins. Les cours existent "
        "dans les deux langues, et beaucoup d'étudiants commencent en "
        "français puis terminent en anglais, ou l'inverse.\n\n"
        "Le foyer étudiant sert de lieu de restauration et de rencontres ; "
        "les associations y organisent leurs activités. Chaque année, des "
        "bourses au mérite récompensent les meilleurs classements : elles "
        "couvrent une partie importante des droits, et le règlement "
        "d'attribution est affiché publiquement.\n\n"
        "Droits universitaires : 800 000 à 1 000 000 FCFA par an, en deux "
        "versements semestriels. Cadre calme pour étudier, loin de "
        "l'agitation des très grandes villes."
    ),
    22: (
        "Institut Polytechnique de Douala. Trois filières au BTS : "
        "informatique et génie logiciel, génie civil et BTP, génie "
        "électrique. C'est tout, et c'est voulu : mieux vaut trois "
        "formations solides que dix survolées.\n\n"
        "L'essentiel du travail se fait en atelier. Réseaux configurés en "
        "vrai, maquettes de structures, armoires électriques et bancs "
        "d'essai : les étudiants manipulent, cassent parfois, réparent "
        "surtout. Les intervenants viennent du métier et racontent le "
        "chantier tel qu'il est.\n\n"
        "Chaque promotion présente le BTS à l'examen national. Les "
        "résultats sont affichés sans retouche, et une partie des lauréats "
        "signe son premier contrat avant même la proclamation officielle, "
        "grâce aux stages de fin de cycle.\n\n"
        "Droits annuels : 1 200 000 à 1 600 000 FCFA selon la filière, "
        "échelonnement possible. Adresse : Douala, région du Littoral — "
        "premier bassin industriel du pays, donc premiers employeurs à "
        "proximité."
    ),
    23: (
        "Une seule filière ici : les sciences de la santé. Et un objectif "
        "clair, former le personnel sanitaire dont l'Extrême-Nord manque le "
        "plus : infirmiers, sages-femmes, techniciens médico-sanitaires.\n\n"
        "La formation alterne sciences fondamentales et pratique clinique. "
        "Dès la première année, les étudiants descendent à l'hôpital "
        "universitaire partenaire : services, maternité, laboratoire. On "
        "n'apprend pas à poser une perfusion sur un tableau noir.\n\n"
        "Les groupes de travaux dirigés restent volontairement réduits. La "
        "direction préfère refuser des candidatures plutôt que d'entasser "
        "quarante étudiants autour d'un seul patient. L'éthique du soin "
        "fait partie des enseignements, au même titre que l'anatomie.\n\n"
        "Coût réel de cet encadrement : 1 800 000 à 1 900 000 FCFA par an. "
        "Ce n'est pas donné, mais chaque franc se retrouve sur le plateau "
        "technique et dans la qualité du suivi. L'école est à Maroua, "
        "chef-lieu de la région de l'Extrême-Nord."
    ),
    24: (
        "Du CP à la Terminale, sur le même campus de Yaoundé : voilà "
        "l'idée du Complexe Scolaire Bilingue Excellence. L'enfant entre "
        "petit et sort avec son Bac, sans changer d'école ni d'amis en "
        "route.\n\n"
        "Deux sections, française et anglaise, avec leurs enseignants "
        "propres. Au secondaire : séries Lettres et sciences humaines ou "
        "Sciences pures. Le programme officiel est préparé sérieusement : "
        "BEPC et Baccalauréat, concours blancs réguliers, suivi rapproché "
        "des classes d'examen.\n\n"
        "La cantine prépare les repas sur place. L'internat est sécurisé, "
        "avec études surveillées le soir — pratique pour les familles qui "
        "habitent loin ou qui travaillent tard.\n\n"
        "Grille tarifaire publique et simple : de 50 000 FCFA au primaire à "
        "500 000 FCFA en Terminale, selon la classe. Pas de frais surprises "
        "en cours d'année. Admissions sur dossier et entretien à la "
        "direction, à Yaoundé, région du Centre."
    ),
    25: (
        "La Faculté des Sciences de l'Université d'Ebolowa forme en Licence "
        "et Master, en français et en anglais, dans deux pôles : "
        "informatique et génie logiciel, sciences pures.\n\n"
        "Ce qui frappe d'abord ici, c'est le coût : 50 000 FCFA par niveau, "
        "point. C'est une politique volontaire de la faculté, pour que la "
        "science ne soit pas réservée aux familles aisées de la région du "
        "Sud. Le montant est unique, connu d'avance, sans frais annexes "
        "découverts en cours d'année.\n\n"
        "Les laboratoires fonctionnent réellement : chimie, physique, "
        "biologie. La bibliothèque garde des espaces calmes, particulièrement "
        "recherchés en période d'examens. Les promotions restent à taille "
        "humaine, donc l'accès aux enseignants et aux machines ne se "
        "dispute pas.\n\n"
        "On étudie à Ebolowa, chef-lieu de la région du Sud, dans un cadre "
        "vert où le bruit de la ville ne dérange pas les travaux de "
        "laboratoire."
    ),
    26: (
        "Pioneer Bilingual Secondary School runs the full Anglo-Saxon cycle "
        "in Bamenda, North West Region — Form 1 right through to Upper "
        "Sixth. English carries the lessons; French stays very present "
        "around campus, so students leave genuinely comfortable in both "
        "languages.\n\n"
        "Two tracks structure the high school: Arts and Humanities, or Pure "
        "Sciences. Whichever they choose, students prepare steadily for the "
        "GCE — regular mock exams, remedial hours for those who need them, "
        "and small revision groups near exam time. Our O-Level and A-Level "
        "results are posted publicly every year, exactly as they come.\n\n"
        "Outside class there is a proper library, football and basketball "
        "grounds, and enough sport in the timetable that students go home "
        "tired in the good sense.\n\n"
        "Tuition sits between 90 000 and 125 000 FCFA a year depending on "
        "the level, payable in instalments at the bursar's office. Come and "
        "see the school before deciding — the gate is open to visiting "
        "parents."
    ),
    27: (
        "Buea College of Health Sciences does one thing: train health "
        "professionals. Nurses, laboratory technicians and allied health "
        "workers, taught in English at the foot of Mount Cameroon, South "
        "West Region.\n\n"
        "From the first year, students spend real time in our teaching "
        "hospital — wards, laboratory, consultation rooms — under the joint "
        "eye of clinicians and lecturers. Reading about a procedure is one "
        "thing; standing beside a patient is another, and that is where "
        "this college puts its effort.\n\n"
        "The laboratories handle anatomy, physiology, microbiology and "
        "biochemistry every week. Tutorial groups stay small on purpose: "
        "nobody hides at the back here, and professional ethics are graded "
        "as seriously as any written paper.\n\n"
        "Annual fees range from 1 000 000 to 1 450 000 FCFA depending on "
        "the programme, payable in instalments — it reflects the true cost "
        "of clinical training. Graduates leave ready for hospitals and "
        "community health programmes across Cameroon, where these skills "
        "remain in short supply."
    ),
}


def seed_establishment_descriptions() -> None:
    with Session(engine) as session:
        for establishment_id, description in ESTABLISHMENT_DESCRIPTIONS.items():
            establishment = session.get(Establishment, establishment_id)
            if establishment is None:
                continue
            old_length = len(establishment.description or "")
            establishment.description = description
            session.add(establishment)
            print(
                f"description {establishment_id} -> {establishment.name} "
                f"({old_length} -> {len(description)} caractères)"
            )
        session.commit()
    print("Descriptions enregistrées.")


if __name__ == "__main__":
    seed_establishment_descriptions()
