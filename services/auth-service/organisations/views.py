from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Organisation, Member, Project
from .serializers import (
    OrganisationSerializer,
    OrganisationCreateSerializer,
    MemberSerializer,
    MemberUpdateSerializer,
    InviteMemberSerializer,
    ProjectSerializer,
    ProjectCreateSerializer,
)
from .permissions import IsOrgAdmin, IsOrgOwner
from .services import OrganisationService, ProjectService


class OrganisationListCreateView(generics.ListCreateAPIView):
    def get_queryset(self):
        return Organisation.objects.filter(members__user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return OrganisationCreateSerializer
        return OrganisationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        org = OrganisationService.create_with_owner(
            name=serializer.validated_data["name"], owner=request.user
        )
        return Response(OrganisationSerializer(org).data, status=status.HTTP_201_CREATED)


class OrganisationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganisationSerializer

    def get_queryset(self):
        return Organisation.objects.filter(members__user=self.request.user)

    def get_object(self):
        return self.get_queryset().get(id=self.kwargs["org_id"])


class MemberListView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "POST":
            return InviteMemberSerializer
        return MemberSerializer

    def get_queryset(self):
        return Member.objects.filter(organisation_id=self.kwargs["org_id"]).select_related("user")

    def create(self, request, *args, **kwargs):
        org = Organisation.objects.get(id=self.kwargs["org_id"])
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invitation = OrganisationService.invite_member(
            org=org,
            email=serializer.validated_data["email"],
            role=serializer.validated_data["role"],
            invited_by=request.user,
        )
        return Response(
            {"detail": f"Invitation sent to {invitation.email}"},
            status=status.HTTP_201_CREATED,
        )


class MemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MemberSerializer

    def get_object(self):
        return Member.objects.get(id=self.kwargs["member_id"], organisation_id=self.kwargs["org_id"])

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return MemberUpdateSerializer
        return MemberSerializer

    def destroy(self, request, *args, **kwargs):
        member = self.get_object()
        if member.role == Member.ROLE_OWNER:
            return Response({"detail": "Cannot remove org owner."}, status=status.HTTP_400_BAD_REQUEST)
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectListCreateView(generics.ListCreateAPIView):
    def get_queryset(self):
        org_id = self.request.query_params.get("org_id")
        qs = Project.objects.filter(organisation__members__user=self.request.user)
        if org_id:
            qs = qs.filter(organisation_id=org_id)
        return qs.select_related("organisation")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProjectCreateSerializer
        return ProjectSerializer

    def create(self, request, *args, **kwargs):
        org_id = request.data.get("org_id")
        org = Organisation.objects.get(id=org_id, members__user=request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = ProjectService.create(
            org=org,
            name=serializer.validated_data["name"],
            description=serializer.validated_data.get("description", ""),
            created_by=request.user,
        )
        return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer

    def get_object(self):
        return Project.objects.get(
            id=self.kwargs["project_id"],
            organisation__members__user=self.request.user,
        )

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
