from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response   import Response
from rest_framework            import status
from .models import DigitalCV, Student, CvEducation, CvExperience, CvSkill, CvLanguage


def ok(data=None, message="OK", http_status=200):
    # http_status parameter lets POST views return 201 Created
    from rest_framework import status as drf_status
    return Response({"error": False, "message": message, "data": data}, status=http_status)

def fail(message="Error", http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"error": True, "message": message}, status=http_status)

def _require_student(request):
    """Returns (student, None) or (None, fail_response). Reuse in every view."""
    if request.user.role != 'student':
        return None, fail("Only students can access this.", status.HTTP_403_FORBIDDEN)
    try:
        return request.user.student, None
    except Student.DoesNotExist:
        return None, fail("Student profile not found.", status.HTTP_404_NOT_FOUND)

def _build_cv_data(cv):
    """Serializes the full CV into a dict — called by GET endpoints."""
    return {
        'id':          cv.pk,
        'github':      cv.github,
        'linkedin':    cv.linkedin,
        'portfolio':   cv.portfolio,
        'description': cv.description,
        'update_date': cv.update_date.isoformat(),
        # Each section is a list — student can add as many entries as they want
        'educations': [
            {
                'id':          e.pk,
                'degree':      e.degree,
                'institution': e.institution,
                'field':       e.field,
                'start_year':  e.start_year,
                'end_year':    e.end_year,
                'is_current':  e.is_current,
                'description': e.description,
            }
            for e in cv.educations.all()
        ],
        'experiences': [
            {
                'id':          x.pk,
                'job_title':   x.job_title,
                'company':     x.company,
                'location':    x.location,
                'start_date':  x.start_date.isoformat(),
                'end_date':    x.end_date.isoformat() if x.end_date else None,
                'is_current':  x.is_current,
                'description': x.description,
            }
            for x in cv.experiences.all()
        ],
        'skills': [
            {'id': s.pk, 'name': s.name, 'level': s.level}
            for s in cv.skills.all()
        ],
        'languages': [
            {'id': l.pk, 'name': l.name, 'level': l.level}
            for l in cv.languages.all()
        ],
    }


# ══ CV GENERAL INFO ═══════════════════════════════════════════════════════════

# GET /api/auth/cv/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_cv(request):
    student, err = _require_student(request)
    if err:
        return err
    try:
        cv = student.digital_cv
        return ok(data=_build_cv_data(cv), message="CV retrieved.")
    except DigitalCV.DoesNotExist:
        return ok(data=None, message="No CV created yet. Use PATCH /api/auth/cv/update/ to create one.")


# PATCH /api/auth/cv/update/
# Creates the CV if it doesn't exist yet, updates it if it does (upsert).
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_cv_info(request):
    student, err = _require_student(request)
    if err:
        return err
    cv, created = DigitalCV.objects.get_or_create(student=student)
    cv.github      = request.data.get('github',      cv.github)
    cv.linkedin    = request.data.get('linkedin',    cv.linkedin)
    cv.portfolio   = request.data.get('portfolio',   cv.portfolio)
    cv.description = request.data.get('description', cv.description)
    cv.save()
    return ok(data=_build_cv_data(cv), message="CV created." if created else "CV updated.")


# ══ EDUCATION ═════════════════════════════════════════════════════════════════
# Student can add multiple education entries (like Europass).

# POST /api/auth/cv/education/
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_education(request):
    student, err = _require_student(request)
    if err:
        return err
    cv, _ = DigitalCV.objects.get_or_create(student=student)

    degree      = request.data.get('degree', '').strip()
    institution = request.data.get('institution', '').strip()
    start_year  = request.data.get('start_year')

    if not degree:
        return fail("'degree' is required. Example: 'Licence 3 Informatique'")
    if not institution:
        return fail("'institution' is required. Example: 'USTHB'")
    if not start_year:
        return fail("'start_year' is required. Example: 2021")
    try:
        start_year = int(start_year)
    except (ValueError, TypeError):
        return fail("'start_year' must be a number.")

    is_current = bool(request.data.get('is_current', False))
    end_year   = request.data.get('end_year')
    if end_year and not is_current:
        try:
            end_year = int(end_year)
        except (ValueError, TypeError):
            return fail("'end_year' must be a number.")
    else:
        end_year = None

    edu = CvEducation.objects.create(
        cv=cv, degree=degree, institution=institution,
        field=request.data.get('field', ''),
        start_year=start_year, end_year=end_year,
        is_current=is_current,
        description=request.data.get('description', ''),
    )
    return ok(data={'id': edu.pk}, message="Education entry added.", http_status=status.HTTP_201_CREATED)


# PATCH /api/auth/cv/education/<pk>/
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_education(request, pk):
    student, err = _require_student(request)
    if err:
        return err
    try:
        edu = CvEducation.objects.get(pk=pk, cv__student=student)
    except CvEducation.DoesNotExist:
        return fail("Education entry not found.", status.HTTP_404_NOT_FOUND)
    edu.degree      = request.data.get('degree',      edu.degree)
    edu.institution = request.data.get('institution', edu.institution)
    edu.field       = request.data.get('field',       edu.field)
    edu.description = request.data.get('description', edu.description)
    edu.is_current  = request.data.get('is_current',  edu.is_current)
    if request.data.get('start_year'):
        edu.start_year = int(request.data['start_year'])
    if request.data.get('end_year'):
        edu.end_year = int(request.data['end_year'])
    edu.save()
    return ok(message="Education entry updated.")


# DELETE /api/auth/cv/education/<pk>/
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_education(request, pk):
    student, err = _require_student(request)
    if err:
        return err
    try:
        edu = CvEducation.objects.get(pk=pk, cv__student=student)
    except CvEducation.DoesNotExist:
        return fail("Education entry not found.", status.HTTP_404_NOT_FOUND)
    edu.delete()
    return ok(message="Education entry deleted.")


# ══ EXPERIENCE ════════════════════════════════════════════════════════════════

# POST /api/auth/cv/experience/
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_experience(request):
    student, err = _require_student(request)
    if err:
        return err
    cv, _ = DigitalCV.objects.get_or_create(student=student)

    job_title  = request.data.get('job_title', '').strip()
    company    = request.data.get('company', '').strip()
    start_date = request.data.get('start_date')

    if not job_title:
        return fail("'job_title' is required.")
    if not company:
        return fail("'company' is required.")
    if not start_date:
        return fail("'start_date' is required. Format: YYYY-MM-DD")

    is_current = bool(request.data.get('is_current', False))
    exp = CvExperience.objects.create(
        cv=cv, job_title=job_title, company=company,
        location=request.data.get('location', ''),
        start_date=start_date,
        end_date=request.data.get('end_date') if not is_current else None,
        is_current=is_current,
        description=request.data.get('description', ''),
    )
    return ok(data={'id': exp.pk}, message="Experience entry added.", http_status=status.HTTP_201_CREATED)


# PATCH /api/auth/cv/experience/<pk>/
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_experience(request, pk):
    student, err = _require_student(request)
    if err:
        return err
    try:
        exp = CvExperience.objects.get(pk=pk, cv__student=student)
    except CvExperience.DoesNotExist:
        return fail("Experience entry not found.", status.HTTP_404_NOT_FOUND)
    exp.job_title   = request.data.get('job_title',   exp.job_title)
    exp.company     = request.data.get('company',     exp.company)
    exp.location    = request.data.get('location',    exp.location)
    exp.description = request.data.get('description', exp.description)
    exp.is_current  = request.data.get('is_current',  exp.is_current)
    if request.data.get('start_date'):
        exp.start_date = request.data['start_date']
    if request.data.get('end_date'):
        exp.end_date = request.data['end_date']
    exp.save()
    return ok(message="Experience entry updated.")


# DELETE /api/auth/cv/experience/<pk>/
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_experience(request, pk):
    student, err = _require_student(request)
    if err:
        return err
    try:
        exp = CvExperience.objects.get(pk=pk, cv__student=student)
    except CvExperience.DoesNotExist:
        return fail("Experience entry not found.", status.HTTP_404_NOT_FOUND)
    exp.delete()
    return ok(message="Experience entry deleted.")


# ══ SKILLS ════════════════════════════════════════════════════════════════════

VALID_SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']

# POST /api/auth/cv/skill/
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_skill(request):
    student, err = _require_student(request)
    if err:
        return err
    cv, _ = DigitalCV.objects.get_or_create(student=student)
    name  = request.data.get('name', '').strip()
    level = request.data.get('level', 'intermediate')
    if not name:
        return fail("'name' is required. Example: 'Python'")
    if level not in VALID_SKILL_LEVELS:
        return fail(f"'level' must be one of: {VALID_SKILL_LEVELS}")
    if CvSkill.objects.filter(cv=cv, name__iexact=name).exists():
        return fail(f"'{name}' is already in your skills.")
    skill = CvSkill.objects.create(cv=cv, name=name, level=level)
    return ok(data={'id': skill.pk, 'name': skill.name, 'level': skill.level}, message="Skill added.", http_status=status.HTTP_201_CREATED)


# PATCH /api/auth/cv/skill/<pk>/
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_skill(request, pk):
    student, err = _require_student(request)
    if err:
        return err
    try:
        skill = CvSkill.objects.get(pk=pk, cv__student=student)
    except CvSkill.DoesNotExist:
        return fail("Skill not found.", status.HTTP_404_NOT_FOUND)
    skill.name  = request.data.get('name',  skill.name)
    skill.level = request.data.get('level', skill.level)
    skill.save()
    return ok(message="Skill updated.")


# DELETE /api/auth/cv/skill/<pk>/
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_skill(request, pk):
    student, err = _require_student(request)
    if err:
        return err
    try:
        skill = CvSkill.objects.get(pk=pk, cv__student=student)
    except CvSkill.DoesNotExist:
        return fail("Skill not found.", status.HTTP_404_NOT_FOUND)
    skill.delete()
    return ok(message="Skill deleted.")


# ══ LANGUAGES ═════════════════════════════════════════════════════════════════

VALID_LANG_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']

# POST /api/auth/cv/language/
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_language(request):
    student, err = _require_student(request)
    if err:
        return err
    cv, _ = DigitalCV.objects.get_or_create(student=student)
    name  = request.data.get('name', '').strip()
    level = request.data.get('level', '').strip()
    if not name:
        return fail("'name' is required. Example: 'English'")
    if level not in VALID_LANG_LEVELS:
        return fail(f"'level' must be one of: {VALID_LANG_LEVELS}")
    if CvLanguage.objects.filter(cv=cv, name__iexact=name).exists():
        return fail(f"'{name}' is already in your languages.")
    lang = CvLanguage.objects.create(cv=cv, name=name, level=level)
    return ok(data={'id': lang.pk, 'name': lang.name, 'level': lang.level}, message="Language added.", http_status=status.HTTP_201_CREATED)


# PATCH /api/auth/cv/language/<pk>/
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_language(request, pk):
    student, err = _require_student(request)
    if err:
        return err
    try:
        lang = CvLanguage.objects.get(pk=pk, cv__student=student)
    except CvLanguage.DoesNotExist:
        return fail("Language not found.", status.HTTP_404_NOT_FOUND)
    lang.name  = request.data.get('name',  lang.name)
    lang.level = request.data.get('level', lang.level)
    lang.save()
    return ok(message="Language updated.")


# DELETE /api/auth/cv/language/<pk>/
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_language(request, pk):
    student, err = _require_student(request)
    if err:
        return err
    try:
        lang = CvLanguage.objects.get(pk=pk, cv__student=student)
    except CvLanguage.DoesNotExist:
        return fail("Language not found.", status.HTTP_404_NOT_FOUND)
    lang.delete()
    return ok(message="Language deleted.")


# ══ CV COMPLETENESS SCORE (Idea E) ════════════════════════════════════════════
# GET /api/auth/cv/score/
# Returns a percentage of how complete the student's CV is + tips to improve.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cv_score(request):
    student, err = _require_student(request)
    if err:
        return err

    score    = 0
    tips     = []
    complete = []

    # ── Base profile checks (30 pts) ──────────────────────────────────────────
    if student.user.full_name:
        score += 10; complete.append("Full name")
    else:
        tips.append("Add your full name in your profile.")

    if student.user.pnum:
        score += 5; complete.append("Phone number")
    else:
        tips.append("Add your phone number.")

    if student.institution:
        score += 10; complete.append("Institution")
    else:
        tips.append("Add your university name.")

    if student.grade:
        score += 5; complete.append("Academic level (grade)")
    else:
        tips.append("Add your academic level (e.g. 'Master 1').")

    # ── CV section checks (70 pts) ────────────────────────────────────────────
    try:
        cv = student.digital_cv

        if cv.github or cv.linkedin or cv.portfolio:
            score += 10; complete.append("Online profile link")
        else:
            tips.append("Add a GitHub, LinkedIn, or portfolio link.")

        if cv.description:
            score += 5; complete.append("Personal summary")
        else:
            tips.append("Write a short personal summary about yourself.")

        edu_count = cv.educations.count()
        if edu_count > 0:
            score += 15; complete.append(f"Education ({edu_count} entries)")
        else:
            tips.append("Add at least one education entry.")

        exp_count = cv.experiences.count()
        if exp_count > 0:
            score += 15; complete.append(f"Experience ({exp_count} entries)")
        else:
            tips.append("Add at least one internship or project experience.")

        skill_count = cv.skills.count()
        if skill_count >= 3:
            score += 20; complete.append(f"Skills ({skill_count} skills)")
        elif skill_count > 0:
            score += 10
            tips.append(f"Add more skills (you have {skill_count}, aim for at least 3).")
        else:
            tips.append("Add your technical skills (Python, Django, React, etc.).")

        lang_count = cv.languages.count()
        if lang_count > 0:
            score += 5; complete.append(f"Languages ({lang_count} languages)")
        else:
            tips.append("Add the languages you speak with CEFR levels.")

    except DigitalCV.DoesNotExist:
        tips.append("Create your Digital CV to unlock all sections.")

    score = min(score, 100)

    if score >= 90:
        label = "Excellent — Your profile is complete!"
    elif score >= 70:
        label = "Good — Almost there, a few sections missing."
    elif score >= 50:
        label = "Average — Keep filling in the sections."
    else:
        label = "Incomplete — Your profile needs much more information."

    return ok(data={
        'score':     score,
        'label':     label,
        'completed': complete,
        'tips':      tips,
    })
def _compute_cv_score(cv):
    """Same logic as applications._compute_cv_score but takes cv directly."""
    score = 0
    s = cv.student
    if s.user.full_name: score += 10
    if s.user.pnum:      score += 5
    if s.institution:    score += 10
    if s.grade:          score += 5
    if cv.github or cv.linkedin or cv.portfolio: score += 10
    if cv.description:   score += 5
    if cv.educations.count() > 0:  score += 15
    if cv.experiences.count() > 0: score += 15
    skill_count = cv.skills.count()
    if skill_count >= 3:   score += 20
    elif skill_count > 0:  score += 10
    if cv.languages.count() > 0: score += 5
    return min(score, 100)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_student_cvs(request):
    query = (request.query_params.get('q') or '').strip()
    if query:
        cvs = DigitalCV.objects.select_related('student__user').filter(
            student__user__full_name__icontains=query
        )[:30]
    else:
        cvs = DigitalCV.objects.select_related(
             'student__user'
        ).prefetch_related(
              'skills', 'languages', 'educations', 'experiences'
        ).order_by('?')[:30]

    def compute_score(cv):
        score = 0
        s = cv.student
        if s.user.full_name: score += 10
        if s.user.pnum:      score += 5
        if s.institution:    score += 10
        if s.grade:          score += 5
        if cv.github or cv.linkedin or cv.portfolio: score += 10
        if cv.description:   score += 5
        if cv.educations.count() > 0:  score += 15
        if cv.experiences.count() > 0: score += 15
        skill_count = cv.skills.count()
        if skill_count >= 3:   score += 20
        elif skill_count > 0:  score += 10
        if cv.languages.count() > 0: score += 5
        return min(score, 100)

    data = [{
        'student_id':  cv.student.pk,
        'full_name':   cv.student.user.full_name,
        'email':       cv.student.user.email,
        'speciality':  cv.student.speciality,
        'institution': cv.student.institution,
        'grade':       cv.student.grade,
        'town':        cv.student.user.town,
        'cv_score':    _compute_cv_score(cv),
        'github':      cv.github,
        'linkedin':    cv.linkedin,
        'description': cv.description,
        'skills':    list(cv.skills.values('name', 'level')[:8]),
        'languages': list(cv.languages.values('name', 'level')[:8]),
            'educations': [
        {
            'degree': e.degree,
            'institution': e.institution,
            'field': e.field,
            'start_year': e.start_year,
            'end_year': e.end_year,
            'is_current': e.is_current,
        }
        for e in cv.educations.all()
    ],
    'experiences': [
        {
            'job_title': x.job_title,
            'company': x.company,
            'location': x.location,
            'start_date': x.start_date.isoformat(),
            'end_date': x.end_date.isoformat() if x.end_date else None,
            'is_current': x.is_current,
            'description': x.description,
        }
        for x in cv.experiences.all()
    ],
        'cv_updated_at': cv.update_date.isoformat(),
    } for cv in cvs]
    return ok(data=data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_cv(request, id):
    try:
        student = Student.objects.get(pk=id)
    except Student.DoesNotExist:
        return fail("Student not found.", status.HTTP_404_NOT_FOUND)
    try:
        cv = student.digital_cv
    except DigitalCV.DoesNotExist:
        return ok(data=None, message="No CV created yet.")
    
    data = _build_cv_data(cv)
    data['cv_score'] = _compute_cv_score(cv)  # ← add this line
    return ok(data=data)