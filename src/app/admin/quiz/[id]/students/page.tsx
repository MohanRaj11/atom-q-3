"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  Search, 
  UserPlus, 
  UserMinus,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"
import { toasts } from "@/lib/toasts"

interface User {
  id: string
  name: string
  email: string
  enrolled: boolean
  completedAt?: string
  score?: number
}

interface Quiz {
  id: string
  title: string
  description?: string
  category?: { name: string }
  timeLimit?: number
  difficulty: string
  status: string
}

export default function QuizStudentsPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  useEffect(() => {
    fetchQuiz()
    fetchUsers()
  }, [quizId])

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/admin/quiz/${quizId}`)
      if (response.ok) {
        const data = await response.json()
        setQuiz(data)
      }
    } catch (error) {
      toasts.networkError()
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/admin/quiz/${quizId}/students`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      toasts.networkError()
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`/api/admin/students/available?quizId=${quizId}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(data)
      }
    } catch (error) {
      toasts.networkError()
    }
  }

  const handleEnrollUsers = async () => {
    if (selectedUsers.length === 0) {
      toasts.warning("Please select at least one user")
      return
    }

    try {
      const response = await fetch(`/api/admin/quiz/${quizId}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentIds: selectedUsers }),
      })

      if (response.ok) {
        const result = await response.json()
        toasts.usersEnrolled(result.enrolledCount)
        if (result.alreadyEnrolled > 0) {
          toasts.info(`${result.alreadyEnrolled} user(s) were already enrolled`)
        }
        setIsEnrollDialogOpen(false)
        setSelectedUsers([])
        fetchUsers()
      } else {
        const error = await response.json()
        toasts.error(error.message || "User enrollment failed")
      }
    } catch (error) {
      toasts.actionFailed("User enrollment")
    }
  }

  const handleUnenrollUser = async (userId: string) => {
    if (!confirm("Are you sure you want to unenroll this user?")) return

    try {
      const response = await fetch(`/api/admin/quiz/${quizId}/students/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toasts.userUnenrolled()
        // Remove the user from the local state to update the UI immediately
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
      } else {
        toasts.actionFailed("User unenrollment")
      }
    } catch (error) {
      toasts.actionFailed("User unenrollment")
    }
  }

  const openEnrollDialog = async () => {
    await fetchAvailableUsers()
    setIsEnrollDialogOpen(true)
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!quiz) {
    return <div className="flex items-center justify-center h-64">Quiz not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage users enrolled in "{quiz.title}"
            </p>
          </div>
        </div>
        <Button onClick={openEnrollDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          Enroll Users
        </Button>
      </div>

      {/* Quiz Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quiz Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Difficulty</Label>
              <Badge variant={
                quiz.difficulty === "EASY" ? "default" :
                quiz.difficulty === "MEDIUM" ? "secondary" : "destructive"
              }>
                {quiz.difficulty}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Time Limit</Label>
              <p className="text-lg">{quiz.timeLimit ? `${quiz.timeLimit} minutes` : "No limit"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Badge variant={quiz.status === "ACTIVE" ? "default" : "secondary"}>
                {quiz.status}
              </Badge>
            </div>
          </div>
          {quiz.description && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="text-sm mt-1">{quiz.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrolled Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enrolled Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Users currently enrolled in this quiz
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.enrolled ? "default" : "secondary"}>
                      {user.enrolled ? "Enrolled" : "Not Enrolled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.score !== undefined ? (
                      <Badge variant={user.score >= 70 ? "default" : "destructive"}>
                        {user.score}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.completedAt ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          {new Date(user.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Not completed</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnenrollUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users enrolled yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enroll Users Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enroll Users</DialogTitle>
            <DialogDescription>
              Select users to enroll in this quiz
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search available users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-md">
              {filteredAvailableUsers.length > 0 ? (
                filteredAvailableUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 border-b last:border-b-0">
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id])
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No available users found
                </div>
              )}
            </div>
            {selectedUsers.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedUsers.length} user(s) selected
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnrollUsers}>
              Enroll Selected Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}