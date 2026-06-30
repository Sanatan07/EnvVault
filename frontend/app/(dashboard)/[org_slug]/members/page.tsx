"use client";
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { orgsApi, membersApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ org_slug: string }>;
}

const ROLE_COLORS: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  owner: "danger",
  admin: "warning",
  editor: "success",
  viewer: "info",
};

export default function MembersPage({ params }: PageProps) {
  const { org_slug } = use(params);
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");

  const { data: orgs } = useQuery({ queryKey: ["organisations"], queryFn: orgsApi.list });
  const org = orgs?.find((o) => o.slug === org_slug);

  const { data: members = [] } = useQuery({
    queryKey: ["members", org?.id],
    queryFn: () => membersApi.list(org!.id),
    enabled: !!org?.id,
  });

  const invite = useMutation({
    mutationFn: () => membersApi.invite(org!.id, { email, role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", org?.id] });
      toast.success(`Invitation sent to ${email}`);
      setInviteOpen(false);
      setEmail("");
      setRole("viewer");
    },
    onError: () => toast.error("Failed to send invitation"),
  });

  const removeMember = useMutation({
    mutationFn: (memberId: string) => membersApi.remove(org!.id, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", org?.id] });
      toast.success("Member removed");
    },
    onError: () => toast.error("Failed to remove member"),
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgSlug={org_slug} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Team Members" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Members</h2>
              <p className="text-sm text-gray-500 mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""}</p>
            </div>
            <Button onClick={() => setInviteOpen(true)} className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.user.email}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_COLORS[member.role] ?? "default"}>{member.role}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(member.created_at)}</TableCell>
                  <TableCell>
                    {member.role !== "owner" && (
                      <button
                        onClick={() => confirm("Remove this member?") && removeMember.mutate(member.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </main>
      </div>

      <Dialog open={inviteOpen} onOpenChange={(o) => !o && setInviteOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="colleague@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={() => invite.mutate()} loading={invite.isPending} disabled={!email}>Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
