from django.urls import path
from .views import (
    OrganisationListCreateView,
    OrganisationDetailView,
    MemberListView,
    MemberDetailView,
    ProjectListCreateView,
    ProjectDetailView,
)

urlpatterns = [
    path("", OrganisationListCreateView.as_view(), name="org-list"),
    path("<uuid:org_id>/", OrganisationDetailView.as_view(), name="org-detail"),
    path("<uuid:org_id>/members/", MemberListView.as_view(), name="member-list"),
    path("<uuid:org_id>/members/<uuid:member_id>/", MemberDetailView.as_view(), name="member-detail"),
]
