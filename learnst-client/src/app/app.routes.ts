import { Routes } from '@angular/router';
import { Role } from '../enums/Role';
import { AuthGuard } from '../guards/auth.guard';
import { ConfirmGuard } from '../guards/confirm.guard.guard';
import { RoleGuard } from '../guards/role.guard';
import { ActivitiesComponent } from './activities/activities.component';
import { ActivityComponent } from './activity/activity.component';
import { HomeComponent } from './home/home.component';
import { LessonComponent } from './lesson/lesson.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { MakeActivityComponent } from './make-activity/make-activity.component';
import { MeComponent } from './me/me.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { RegisterComponent } from './register/register.component';
import { TicketDetailComponent } from './ticket-detail/ticket-detail.component';
import { TicketListComponent } from './ticket-list/ticket-list.component';
import { UserComponent } from './user/user.component';
import { UsersComponent } from './users/users.component';
import { TermsOfUseComponent } from './terms-of-use/terms-of-use.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'not-found', component: NotFoundComponent },
  { path: 'termsofuse', component: TermsOfUseComponent },
  { path: 'privacypolicy', component: PrivacyPolicyComponent },
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard], data: { auth: false } },
  { path: 'register', component: RegisterComponent, canActivate: [AuthGuard], data: { auth: false } },
  { path: 'logout', component: LogoutComponent, canActivate: [AuthGuard] },
  { path: 'me', component: MeComponent, canActivate: [AuthGuard], canDeactivate: [ConfirmGuard] },
  { path: 'user/:userId', component: UserComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },

  { path: 'activities', component: ActivitiesComponent, canActivate: [AuthGuard] },
  { path: 'activity/make', component: MakeActivityComponent, canActivate: [RoleGuard], data: { roles: [Role.Specialist, Role.Admin] } },
  { path: 'activity/make/:activityId', component: MakeActivityComponent, canActivate: [RoleGuard], data: { roles: [Role.Specialist, Role.Admin] } },
  { path: 'activity/:activityId', component: ActivityComponent, canActivate: [AuthGuard] },
  { path: 'lesson/:lessonId', component: LessonComponent, canActivate: [AuthGuard] },
  { path: 'tickets', component: TicketListComponent, canActivate: [AuthGuard] },
  { path: 'ticket/:ticketId', component: TicketDetailComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: '/not-found' }
];
