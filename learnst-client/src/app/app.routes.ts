import { Routes } from '@angular/router';
import { Role } from '../enums/Role';
import { AuthGuard } from '../guards/auth.guard';
import { ConfirmGuard } from '../guards/confirm.guard.guard';
import { RoleGuard } from '../guards/role.guard';
import { ActivitiesComponent } from './activities/activities.component';
import { ActivityComponent } from './activity/activity.component';
import { DevAppComponent } from './dev/app/app.component';
import { DevAppsComponent } from './dev/apps/apps.component';
import { CreateClientComponent } from './dev/apps/create/create.component';
import { OAuth2Component } from './dev/apps/oauth2/oauth2.component';
import { DevComponent } from './dev/dev.component';
import { HomeComponent } from './home/home.component';
import { LessonComponent } from './lesson/lesson.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { MakeActivityComponent } from './make-activity/make-activity.component';
import { MeComponent } from './me/me.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PrivacyPolicyComponent } from './manuals/privacy-policy/privacy-policy.component';
import { RegisterComponent } from './register/register.component';
import { TermsOfUseComponent } from './manuals/terms-of-use/terms-of-use.component';
import { TicketDetailComponent } from './ticket-detail/ticket-detail.component';
import { TicketListComponent } from './ticket-list/ticket-list.component';
import { UserComponent } from './user/user.component';
import { UsersComponent } from './users/users.component';
import { DocsComponent } from './dev/docs/docs.component';
import { JavaSandboxComponent } from './code/java-sandbox/java-sandbox';
import { JavaScriptSandboxComponent } from './code/javascript-sandbox/javascript-sandbox';
import { CSharpSandboxComponent } from './code/csharp-sandbox/csharp-sandbox';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'manuals/termsofuse', component: TermsOfUseComponent },
  { path: 'manuals/privacypolicy', component: PrivacyPolicyComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'logout', component: LogoutComponent, canActivate: [AuthGuard] },
  { path: 'me', component: MeComponent, canActivate: [AuthGuard], canDeactivate: [ConfirmGuard] },
  { path: 'user/:userId', component: UserComponent, canActivate: [AuthGuard] },
  { path: 'community', component: UsersComponent, canActivate: [AuthGuard] },

  { path: 'activities', component: ActivitiesComponent, canActivate: [AuthGuard] },
  { path: 'activity/make', component: MakeActivityComponent, canActivate: [RoleGuard], data: { roles: [Role.Specialist, Role.Admin] } },
  { path: 'activity/make/:activityId', component: MakeActivityComponent, canActivate: [RoleGuard], data: { roles: [Role.Specialist, Role.Admin] } },
  { path: 'activity/:activityId', component: ActivityComponent, canActivate: [AuthGuard] },
  { path: 'lesson/:lessonId', component: LessonComponent, canActivate: [AuthGuard] },
  { path: 'tickets', component: TicketListComponent, canActivate: [AuthGuard] },
  { path: 'ticket/:ticketId', component: TicketDetailComponent, canActivate: [AuthGuard] },
  { path: 'app/:clientId', component: DevAppComponent, canActivate: [AuthGuard] },
  { path: 'dev/apps/oauth2', component: OAuth2Component, canActivate: [AuthGuard] },
  { path: 'dev/apps/create', component: CreateClientComponent, canActivate: [AuthGuard] },
  { path: 'dev/apps', component: DevAppsComponent, canActivate: [AuthGuard] },
  { path: 'dev/docs', component: DocsComponent, canActivate: [AuthGuard] },
  { path: 'dev', component: DevComponent, canActivate: [AuthGuard] },

  { path: 'code/csharp', component: CSharpSandboxComponent },
  { path: 'code/js', component: JavaScriptSandboxComponent },
  { path: 'code/java', component: JavaSandboxComponent },

  { path: '**', component: NotFoundComponent }
];
