"use client"

import { useState, useEffect } from "react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  MoreHorizontal,
  Search,
  Plus,
  Download,
  Upload,
  Edit,
  Trash2,
  Settings,
  Users,
  Clock,
  Calendar
} from "lucide-react"
import { toasts } from "@/lib/toasts"
import { DifficultyLevel, QuizStatus } from "@prisma/client"

interface Quiz {
  id: string
  title: string
  description?: string
  timeLimit?: number
  difficulty: DifficultyLevel
  status: QuizStatus
  negativeMarking: boolean
  negativePoints: number
  randomOrder: boolean
  maxAttempts?: number
  startTime?: string
  endTime?: string
  createdAt: string
  _count: {
    quizQuestions: number
    quizAttempts: number
  }
}

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    timeLimit: "",
    difficulty: DifficultyLevel.MEDIUM,
    negativeMarking: false,
    negativePoints: 0.5,
    randomOrder: false,
    maxAttempts: "",
    startTime: "",
    endTime: "",
  })

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/admin/quiz")
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data)
      }
    } catch (error) {
      toasts.networkError()
    } finally {
      setLoading(false)
    }
  }

  

  const handleCreateQuiz = async () => {
    try {
      const response = await fetch("/api/admin/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
          maxAttempts: formData.maxAttempts ? parseInt(formData.maxAttempts) : null,
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
        }),
      })

      if (response.ok) {
        toasts.quizCreated(formData.title)
        setIsCreateDialogOpen(false)
        setFormData({
          title: "",
          description: "",
          timeLimit: "",
          difficulty: DifficultyLevel.MEDIUM,
          negativeMarking: false,
          negativePoints: 0.5,
          randomOrder: false,
          maxAttempts: "",
          startTime: "",
          endTime: "",
        })
        fetchQuizzes()
      } else {
        toasts.actionFailed("Quiz creation")
      }
    } catch (error) {
      toasts.actionFailed("Quiz creation")
    }
  }

  const handleUpdateQuiz = async () => {
    if (!selectedQuiz) return

    try {
      const response = await fetch(`/api/admin/quiz/${selectedQuiz.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          difficulty: formData.difficulty,
        }),
      })

      if (response.ok) {
        toasts.quizUpdated(formData.title)
        setIsEditDialogOpen(false)
        fetchQuizzes()
      } else {
        toasts.actionFailed("Quiz update")
      }
    } catch (error) {
      toasts.actionFailed("Quiz update")
    }
  }

  const handleSaveSettings = async () => {
    if (!selectedQuiz) return

    try {
      const response = await fetch(`/api/admin/quiz/${selectedQuiz.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
          negativeMarking: formData.negativeMarking,
          negativePoints: formData.negativePoints,
          randomOrder: formData.randomOrder,
          maxAttempts: formData.maxAttempts ? parseInt(formData.maxAttempts) : null,
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
        }),
      })

      if (response.ok) {
        toasts.quizUpdated(formData.title)
        setIsSettingsDialogOpen(false)
        fetchQuizzes()
      } else {
        toasts.actionFailed("Quiz settings update")
      }
    } catch (error) {
      toasts.actionFailed("Quiz settings update")
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return

    try {
      const response = await fetch(`/api/admin/quiz/${quizId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const quiz = quizzes.find(q => q.id === quizId)
        if (quiz) {
          toasts.quizDeleted(quiz.title)
        }
        setQuizzes(quizzes.filter(quiz => quiz.id !== quizId))
      } else {
        toasts.actionFailed("Quiz deletion")
      }
    } catch (error) {
      toasts.actionFailed("Quiz deletion")
    }
  }

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openEditDialog = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setFormData({
      title: quiz.title,
      description: quiz.description || "",
      timeLimit: quiz.timeLimit?.toString() || "",
      difficulty: quiz.difficulty as DifficultyLevel,
      negativeMarking: quiz.negativeMarking,
      negativePoints: quiz.negativePoints,
      randomOrder: quiz.randomOrder,
      maxAttempts: quiz.maxAttempts?.toString() || "",
      startTime: quiz.startTime ? new Date(quiz.startTime).toISOString().slice(0, 16) : "",
      endTime: quiz.endTime ? new Date(quiz.endTime).toISOString().slice(0, 16) : "",
    })
    setIsEditDialogOpen(true)
  }

  const openSettingsDialog = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setFormData({
      title: quiz.title,
      description: quiz.description || "",
      timeLimit: quiz.timeLimit?.toString() || "",
      difficulty: quiz.difficulty as DifficultyLevel,
      negativeMarking: quiz.negativeMarking,
      negativePoints: quiz.negativePoints,
      randomOrder: quiz.randomOrder,
      maxAttempts: quiz.maxAttempts?.toString() || "",
      startTime: quiz.startTime ? new Date(quiz.startTime).toISOString().slice(0, 16) : "",
      endTime: quiz.endTime ? new Date(quiz.endTime).toISOString().slice(0, 16) : "",
    })
    setIsSettingsDialogOpen(true)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz Management</h1>
          <p className="text-muted-foreground">
            Create and manage quizzes for your users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={() => {
            if (selectedQuiz) {
              window.location.href = `/admin/quiz/${selectedQuiz.id}/questions`
            } else {
              toasts.warning("Please select a quiz first")
            }
          }}>
            <Users className="mr-2 h-4 w-4" />
            Questions
          </Button>
          <Button variant="outline" onClick={() => {
            if (selectedQuiz) {
              window.location.href = `/admin/quiz/${selectedQuiz.id}/students`
            } else {
              toasts.warning("Please select a quiz first")
            }
          }}>
            <Users className="mr-2 h-4 w-4" />
            Users
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quizzes</CardTitle>
          <CardDescription>
            A list of all quizzes available on the platform
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
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
                <TableHead>Title</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuizzes.map((quiz) => (
                <TableRow
                  key={quiz.id}
                  className={selectedQuiz?.id === quiz.id ? "bg-muted/50" : ""}
                  onClick={() => setSelectedQuiz(quiz)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell className="font-medium">
                    <div>
                      <div>{quiz.title}</div>
                      {quiz.description && (
                        <div className="text-sm text-muted-foreground">
                          {quiz.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      quiz.difficulty === DifficultyLevel.EASY ? "default" :
                      quiz.difficulty === DifficultyLevel.MEDIUM ? "secondary" : "destructive"
                    }>
                      {quiz.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>{quiz._count.quizQuestions}</TableCell>
                  <TableCell>{quiz.maxAttempts || "∞"}</TableCell>
                  <TableCell>
                    <Badge variant={quiz.status === QuizStatus.ACTIVE ? "default" : "secondary"}>
                      {quiz.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(quiz)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openSettingsDialog(quiz)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          window.location.href = `/admin/quiz/${quiz.id}/questions`
                        }}>
                          <Users className="mr-2 h-4 w-4" />
                          Questions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          window.location.href = `/admin/quiz/${quiz.id}/students`
                        }}>
                          <Users className="mr-2 h-4 w-4" />
                          Users
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Quiz Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
            <DialogDescription>
              Create a new quiz with custom settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Difficulty
              </Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({...formData, difficulty: value as DifficultyLevel})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DifficultyLevel.EASY}>Easy</SelectItem>
                  <SelectItem value={DifficultyLevel.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={DifficultyLevel.HARD}>Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateQuiz}>Create Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quiz Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
            <DialogDescription>
              Update quiz information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateQuiz}>Update Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz Settings</DialogTitle>
            <DialogDescription>
              Configure advanced quiz settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timeLimit" className="text-right">
                Time Limit (min)
              </Label>
              <Input
                id="timeLimit"
                type="number"
                value={formData.timeLimit}
                onChange={(e) => setFormData({...formData, timeLimit: e.target.value})}
                className="col-span-3"
                placeholder="Leave empty for no limit"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxAttempts" className="text-right">
                Max Attempts
              </Label>
              <Input
                id="maxAttempts"
                type="number"
                value={formData.maxAttempts}
                onChange={(e) => setFormData({...formData, maxAttempts: e.target.value})}
                className="col-span-3"
                placeholder="Leave empty for unlimited"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="negativeMarking" className="text-right">
                Negative Marking
              </Label>
              <Switch
                id="negativeMarking"
                checked={formData.negativeMarking}
                onCheckedChange={(checked) => setFormData({...formData, negativeMarking: checked})}
              />
            </div>
            {formData.negativeMarking && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="negativePoints" className="text-right">
                  Negative Points
                </Label>
                <Input
                  id="negativePoints"
                  type="number"
                  step="0.1"
                  value={formData.negativePoints}
                  onChange={(e) => setFormData({...formData, negativePoints: parseFloat(e.target.value)})}
                  className="col-span-3"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="randomOrder" className="text-right">
                Random Order
              </Label>
              <Switch
                id="randomOrder"
                checked={formData.randomOrder}
                onCheckedChange={(checked) => setFormData({...formData, randomOrder: checked})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}