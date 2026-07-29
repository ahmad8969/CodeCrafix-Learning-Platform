import { Link } from 'react-router-dom'
import { Clock3, Layers3, MoreHorizontal, User } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HoverLift } from '@/components/ui/motion'

const statusVariant = {
  draft: 'secondary',
  published: 'success',
  archived: 'warning',
}

export function CourseCard({
  course,
  basePath = '/admin/courses',
  onPublish,
  onArchive,
  onDelete,
  readOnly = false,
}) {
  const id = course._id || course.id

  return (
    <HoverLift>
      <Card hover className="h-full overflow-hidden">
        <div className="relative h-36 bg-linear-to-br from-emerald-500/25 via-teal-500/10 to-cyan-500/5">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No thumbnail
            </div>
          )}
          <Badge className="absolute left-3 top-3" variant={statusVariant[course.status] || 'secondary'}>
            {course.status}
          </Badge>
        </div>
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-start justify-between gap-2">
            <Link to={`${basePath}/${id}`} className="font-bold leading-snug hover:text-primary">
              {course.title}
            </Link>
            {!readOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="size-8">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`${basePath}/${id}/edit`}>Edit</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPublish?.(course)}>Publish</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onArchive?.(course)}>Archive</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(course)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <Badge variant="outline">{course.category?.name || 'Uncategorized'}</Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p className="inline-flex items-center gap-1.5">
            <User className="size-3.5" />
            {course.instructor?.fullName || 'Instructor'}
          </p>
          <p className="inline-flex items-center gap-1.5 capitalize">
            <Clock3 className="size-3.5" />
            {course.duration} · {course.difficulty}
          </p>
          <p className="inline-flex items-center gap-1.5">
            <Layers3 className="size-3.5" />
            {course.batchCount || 0} batches · {course.studentCountPlaceholder || 0} students
          </p>
          {course.publishedAt && (
            <p>Published {new Date(course.publishedAt).toLocaleDateString()}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link to={`${basePath}/${id}`}>View details</Link>
          </Button>
        </CardFooter>
      </Card>
    </HoverLift>
  )
}
