import os
from datetime import date
from django.conf import settings
from reportlab.lib.pagesizes   import A4
from reportlab.lib.units        import cm
from reportlab.lib              import colors
from reportlab.lib.styles       import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums        import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus         import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable, KeepTogether
)

DARK       = colors.HexColor("#1a1a2e")
BLUE       = colors.HexColor("#1a6bb5")
LIGHT_BLUE = colors.HexColor("#e8f1fb")
MID        = colors.HexColor("#444444")
MUTED      = colors.HexColor("#777777")
BORDER     = colors.HexColor("#cccccc")
LIGHT_GRAY = colors.HexColor("#f4f4f4")
WHITE      = colors.white
GREEN      = colors.HexColor("#2d7d46")
ORANGE     = colors.HexColor("#c96a00")


def _styles():
    base = getSampleStyleSheet()

    def S(name, parent="Normal", **kw):
        return ParagraphStyle(name, parent=base[parent], **kw)

    return {
        "title":        S("title",        fontSize=20, textColor=DARK,  fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=4),
        "subtitle":     S("subtitle",     fontSize=11, textColor=BLUE,  fontName="Helvetica",      alignment=TA_CENTER, spaceAfter=2),
        "ref":          S("ref",          fontSize=9,  textColor=MUTED, fontName="Helvetica",      alignment=TA_CENTER, spaceAfter=12),
        "section":      S("section",      fontSize=11, textColor=WHITE, fontName="Helvetica-Bold", alignment=TA_LEFT,   spaceBefore=14, spaceAfter=0),
        "body":         S("body",         fontSize=9.5,textColor=MID,   fontName="Helvetica",      leading=15, spaceAfter=6, alignment=TA_JUSTIFY),
        "label":        S("label",        fontSize=8,  textColor=MUTED, fontName="Helvetica-Bold", spaceAfter=1),
        "value":        S("value",        fontSize=9.5,textColor=DARK,  fontName="Helvetica",      leading=14, spaceAfter=4),
        "small":        S("small",        fontSize=8,  textColor=MUTED, fontName="Helvetica",      leading=12, spaceAfter=4),
        "sign_label":   S("sign_label",   fontSize=8.5,textColor=MID,   fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=4),
        "sign_value":   S("sign_value",   fontSize=8.5,textColor=GREEN, fontName="Helvetica",      alignment=TA_CENTER, spaceAfter=2),
        "sign_pending": S("sign_pending", fontSize=8.5,textColor=ORANGE,fontName="Helvetica",      alignment=TA_CENTER, spaceAfter=2),
        "footer":       S("footer",       fontSize=7.5,textColor=MUTED, fontName="Helvetica",      alignment=TA_CENTER),
    }


def _section_header(text, st):
    data = [[Paragraph(f"  {text}", st["section"])]]
    t = Table(data, colWidths=[17*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), BLUE),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
    ]))
    return t


def _info_table(rows, st, col_widths=None):
    col_widths = col_widths or [4.5*cm, 12.5*cm]
    data = []
    for label, value in rows:
        data.append([
            Paragraph(label, st["label"]),
            Paragraph(str(value) if value else "—", st["value"]),
        ])
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (0,-1), LIGHT_GRAY),
        ("BACKGROUND",    (1,0), (1,-1), WHITE),
        ("ROWBACKGROUNDS",(0,0), (-1,-1), [WHITE, LIGHT_BLUE]),
        ("BOX",           (0,0), (-1,-1), 0.5, BORDER),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    return t


def _fmt_date(d):
    if d is None:
        return "Non renseigné"
    if hasattr(d, "date"):
        d = d.date()
    months = ["", "janvier", "février", "mars", "avril", "mai", "juin",
              "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
    return f"{d.day:02d} {months[d.month]} {d.year}"


def _fmt_signed(dt):
    if dt is None:
        return "En attente de signature"
    return f"Signé le {_fmt_date(dt)}"


def generate_convention_pdf(convention) -> str:
    application = convention.application
    student     = application.student      
    offer       = application.offer
    company     = offer.company              

    rel_dir  = f"conventions/{convention.pk}"
    abs_dir  = os.path.join(settings.MEDIA_ROOT, rel_dir)
    os.makedirs(abs_dir, exist_ok=True)

    filename = f"convention_{convention.pk}.pdf"
    abs_path = os.path.join(abs_dir, filename)
    rel_path = os.path.join(rel_dir, filename)

    W = A4[0] - 4*cm
    doc = SimpleDocTemplate(
        abs_path,
        pagesize=A4,
        topMargin=2.5*cm, bottomMargin=2*cm,
        leftMargin=2*cm,  rightMargin=2*cm,
        title=f"Convention de Stage — {student.user.full_name}",  
        author="Stag.io Platform",
    )

    st    = _styles()
    story = []

    story.append(Paragraph("CONVENTION DE STAGE", st["title"]))
    story.append(Paragraph("Plateforme Stag.io — Accord de Stage Professionnel", st["subtitle"]))
    story.append(Paragraph(f"Réf. CONV-{convention.pk:04d}  ·  Généré le {_fmt_date(date.today())}", st["ref"]))
    story.append(HRFlowable(width=W, thickness=1.5, color=BLUE, spaceAfter=12))
    story.append(Paragraph(
        "La présente convention est établie entre les parties désignées ci-dessous, "
        "conformément aux dispositions légales en vigueur régissant les stages en entreprise. "
        "Elle définit les conditions d'accueil et d'encadrement du stagiaire au sein de "
        "l'établissement d'accueil pour la durée mentionnée.",
        st["body"]
    ))
    story.append(Spacer(1, 6))

    story.append(_section_header("Article 1 — Parties de la Convention", st))
    story.append(Spacer(1, 8))

    story.append(Paragraph("1.1  Le Stagiaire", st["label"]))
    story.append(_info_table([
        ("Nom complet",     student.user.full_name),           # fixed
        ("Email",           student.user.email),               # fixed
        ("Téléphone",       student.user.pnum or "Non renseigné"),  # fixed
        ("Établissement",   student.institution or "Non renseigné"),
        ("Filière",         student.field or "Non renseigné"),
        ("Spécialité",      student.speciality or "Non renseigné"),  # fixed typo
        ("Niveau d'études", student.grade or "Non renseigné"),
    ], st))
    story.append(Spacer(1, 8))

    story.append(Paragraph("1.2  L'Entreprise d'Accueil", st["label"]))
    story.append(_info_table([
        ("Raison sociale",  company.company_name or company.user.full_name),  # fixed
        ("Secteur",         company.company_sector or "Non renseigné"),
        ("Site web",        company.company_website or "Non renseigné"),
        ("Email contact",   company.user.email),               # fixed
        ("Téléphone",       company.user.pnum or "Non renseigné"),  # fixed
    ], st))
    story.append(Spacer(1, 8))

    story.append(Paragraph("1.3  L'Établissement d'Enseignement", st["label"]))
    story.append(_info_table([
        ("Établissement",   student.institution or "Non renseigné"),
        ("Représenté par",  "Le service des stages et relations entreprises"),
        ("Validé via",      "Plateforme Stag.io"),
    ], st))

    story.append(Spacer(1, 4))
    story.append(_section_header("Article 2 — Objet et Modalités du Stage", st))
    story.append(Spacer(1, 8))

    type_labels = {
        "INTERNSHIP": "Stage professionnel",
        "ALTERNANCE":  "Contrat en alternance",
        "FINAL_YEAR":  "Projet de Fin d'Études (PFE)",
    }
    internship_type = type_labels.get(offer.internship_type, offer.internship_type)

    story.append(_info_table([
        ("Intitulé du poste", offer.title),
        ("Type de stage",     internship_type),
        ("Domaine",           offer.field or "Non renseigné"),
        ("Lieu de stage",     offer.town),                     # fixed: town not location
        ("Durée",             offer.duration or "Non renseigné"),
        ("Date de début",     _fmt_date(convention.start_date)),
        ("Date de fin",       _fmt_date(convention.end_date)),
        ("Rémunération",      offer.salary if offer.is_paid else "Stage non rémunéré"),
    ], st))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Description de la mission :", st["label"]))
    story.append(Paragraph(
        offer.description if offer.description else "Voir l'offre de stage détaillée sur la plateforme Stag.io.",
        st["body"]
    ))

    if offer.skills:
        story.append(Spacer(1, 4))
        story.append(Paragraph("Compétences requises :", st["label"]))
        story.append(Paragraph(offer.skills, st["body"]))

    story.append(Spacer(1, 4))
    story.append(_section_header("Article 3 — Obligations des Parties", st))
    story.append(Spacer(1, 8))

    obligations = [
        ["Partie", "Obligations principales"],
        ["L'entreprise\nd'accueil",
         "• Accueillir le stagiaire et lui confier des missions conformes à sa formation\n"
         "• Désigner un maître de stage chargé de l'encadrement\n"
         "• Fournir les équipements et accès nécessaires à l'exécution des missions\n"
         "• Respecter la durée et les horaires convenus"],
        ["L'établissement\nd'enseignement",
         "• Valider la convention de stage\n"
         "• Assurer le suivi pédagogique du stagiaire\n"
         "• Désigner un enseignant référent\n"
         "• Évaluer le rapport de stage remis à l'issue de la période"],
        ["Le stagiaire",
         "• Respecter le règlement intérieur de l'entreprise\n"
         "• Accomplir les missions confiées avec sérieux et professionnalisme\n"
         "• Observer la confidentialité concernant les informations de l'entreprise\n"
         "• Rédiger et remettre un rapport de stage dans les délais impartis"],
    ]

    t = Table(obligations, colWidths=[3.5*cm, 13.5*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), DARK),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,0), 9),
        ("BACKGROUND",    (0,1), (0,-1), LIGHT_GRAY),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT_BLUE]),
        ("FONTNAME",      (0,1), (0,-1), "Helvetica-Bold"),
        ("FONTSIZE",      (0,1), (-1,-1), 9),
        ("TEXTCOLOR",     (0,1), (-1,-1), MID),
        ("BOX",           (0,0), (-1,-1), 0.5, BORDER),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ]))
    story.append(t)

    story.append(Spacer(1, 4))
    story.append(_section_header("Article 4 — Confidentialité et Assurance", st))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "<b>Confidentialité :</b> Le stagiaire s'engage à ne divulguer aucune information "
        "confidentielle obtenue au cours du stage, notamment les procédés de fabrication, "
        "les données clients, les stratégies commerciales et tout autre secret d'entreprise. "
        "Cette obligation de confidentialité s'étend au-delà de la période de stage.",
        st["body"]
    ))
    story.append(Paragraph(
        "<b>Assurance :</b> L'entreprise d'accueil s'engage à couvrir le stagiaire par "
        "sa police d'assurance responsabilité civile pour les dommages causés dans le cadre "
        "de l'exercice de ses missions. L'établissement d'enseignement atteste que le stagiaire "
        "bénéficie d'une couverture pour les accidents survenus dans le cadre du stage.",
        st["body"]
    ))

    story.append(Spacer(1, 4))
    story.append(_section_header("Article 5 — Signatures et Validation", st))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "La présente convention est signée électroniquement par les trois parties via la "
        "plateforme Stag.io. Chaque signature horodatée a valeur juridique équivalente "
        "à une signature manuscrite conformément à la réglementation en vigueur.",
        st["body"]
    ))
    story.append(Spacer(1, 6))

    def sig_box(party, signed_at):
        is_signed   = signed_at is not None
        status_text = _fmt_signed(signed_at)
        status_style = st["sign_value"] if is_signed else st["sign_pending"]
        indicator   = "✓ Signé" if is_signed else "⏳ En attente"
        ind_color   = GREEN if is_signed else ORANGE
        bg_color    = colors.HexColor("#f0fff4") if is_signed else colors.HexColor("#fffbf0")

        data = [
            [Paragraph(party,       st["sign_label"])],
            [Paragraph(indicator,   ParagraphStyle("ind", fontSize=10, fontName="Helvetica-Bold", alignment=TA_CENTER, textColor=ind_color))],
            [Paragraph(status_text, status_style)],
        ]
        t = Table(data, colWidths=[5.2*cm])
        t.setStyle(TableStyle([
            ("BACKGROUND",    (0,0), (-1,-1), bg_color),
            ("BOX",           (0,0), (-1,-1), 1, ind_color),
            ("TOPPADDING",    (0,0), (-1,-1), 8),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
            ("LEFTPADDING",   (0,0), (-1,-1), 8),
            ("RIGHTPADDING",  (0,0), (-1,-1), 8),
            ("ALIGN",         (0,0), (-1,-1), "CENTER"),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ]))
        return t

    sig_row = [[
        sig_box("Le Stagiaire\n" + student.user.full_name,                          convention.student_signed_at),  
        sig_box("L'Entreprise\n" + (company.company_name or company.user.full_name), convention.company_signed_at),  
        sig_box("Validation Administrative\nStag.io",                               convention.admin_signed_at),
    ]]

    sig_table = Table(sig_row, colWidths=[5.5*cm, 5.5*cm, 5.5*cm], hAlign="CENTER")
    sig_table.setStyle(TableStyle([
        ("ALIGN",        (0,0), (-1,-1), "CENTER"),
        ("VALIGN",       (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING",  (0,0), (-1,-1), 4),
        ("RIGHTPADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 12))

    status_colors = {
        "VALIDATED":       (colors.HexColor("#f0fff4"), GREEN,  "CONVENTION VALIDÉE"),
        "PENDING_ADMIN":   (colors.HexColor("#fffbf0"), ORANGE, "EN ATTENTE DE VALIDATION ADMINISTRATIVE"),
        "PENDING_COMPANY": (colors.HexColor("#fffbf0"), ORANGE, "EN ATTENTE DE SIGNATURE ENTREPRISE"),
        "PENDING_STUDENT": (colors.HexColor("#fffbf0"), ORANGE, "EN ATTENTE DE SIGNATURE STAGIAIRE"),
        "DRAFT":           (LIGHT_GRAY,                 MUTED,  "BROUILLON — NON FINALISÉ"),
        "REJECTED":        (colors.HexColor("#fff5f5"), colors.HexColor("#a32d2d"), "CONVENTION REJETÉE"),
    }
    bg, fg, label = status_colors.get(convention.status, (LIGHT_GRAY, MUTED, convention.status))

    status_data = [[Paragraph(f"Statut : {label}", ParagraphStyle(
        "st", fontSize=10, fontName="Helvetica-Bold", textColor=fg, alignment=TA_CENTER
    ))]]
    status_t = Table(status_data, colWidths=[W])
    status_t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), bg),
        ("BOX",           (0,0), (-1,-1), 1, fg),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
    ]))
    story.append(status_t)

    def on_page(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        footer_text = (
            f"Stag.io — Convention de Stage · Réf. CONV-{convention.pk:04d} · "
            f"Généré le {_fmt_date(date.today())}"
        )
        canvas.drawString(2*cm, 1.2*cm, footer_text)
        canvas.drawRightString(A4[0]-2*cm, 1.2*cm, f"Page {doc.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    return rel_path