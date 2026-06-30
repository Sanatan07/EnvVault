from rest_framework import serializers
from .models import Organisation, Member, Project, Invitation


class OrganisationSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organisation
        fields = ["id", "name", "slug", "plan", "member_count", "created_at"]
        read_only_fields = ["id", "slug", "created_at"]

    def get_member_count(self, obj):
        return obj.members.count()


class OrganisationCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)


class MemberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Member
        fields = ["id", "email", "full_name", "role", "created_at"]
        read_only_fields = ["id", "created_at"]


class MemberUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ["role"]


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=Member.ROLE_CHOICES)


class ProjectSerializer(serializers.ModelSerializer):
    org_slug = serializers.CharField(source="organisation.slug", read_only=True)

    class Meta:
        model = Project
        fields = ["id", "name", "slug", "description", "org_slug", "created_at"]
        read_only_fields = ["id", "slug", "org_slug", "created_at"]


class ProjectCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
