import {Routes} from '@angular/router';
import {Role} from '../data/enums/Role';
import {AuthGuard} from '../angular/guards/auth.guard';
import {ConfirmGuard} from '../angular/guards/confirm.guard.guard';
import {RoleGuard} from '../angular/guards/role.guard';
import {ActivitiesComponent} from './pages/activities/activities.component';
import {ActivityComponent} from './pages/activity/activity.component';
import {HomeComponent} from './pages/home/home.component';
import {LessonComponent} from './pages/lesson/lesson.component';
import {LoginComponent} from './pages/login/login.component';
import {MakeActivityComponent} from './pages/make-activity/make-activity.component';
import {MeComponent} from './pages/me/me.component';
import {NotFoundComponent} from './pages/not-found/not-found.component';
import {PrivacyPolicyComponent} from './pages/manuals/privacy-policy/privacy-policy.component';
import {RegisterComponent} from './pages/register/register.component';
import {TermsOfUseComponent} from './pages/manuals/terms-of-use/terms-of-use.component';
import {TicketComponent} from './pages/ticket/ticket.component';
import {SupportComponent} from './pages/support/support.component';
import {UserComponent} from './pages/user/user.component';
import {CommunityComponent} from './pages/community/community.component';
import {ManualsComponent} from './pages/manuals/manuals.component';
import {SettingsComponent} from './pages/settings/settings.component';
import {TwitchComponent} from './pages/twitch/twitch.component';

export const routes: Routes = [
  {path: '', component: HomeComponent},

  {path: 'manuals/termsofuse', component: TermsOfUseComponent},
  {path: 'manuals/privacypolicy', component: PrivacyPolicyComponent},
  {path: 'manuals', component: ManualsComponent},
  {path: 'settings', component: SettingsComponent},
  {path: 'twitch', component: TwitchComponent},

  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'me', component: MeComponent, canActivate: [AuthGuard], canDeactivate: [ConfirmGuard]},
  {path: 'user/:userName', component: UserComponent, canActivate: [AuthGuard]},
  {path: 'community', component: CommunityComponent, canActivate: [AuthGuard]},

  {path: 'activities', component: ActivitiesComponent, canActivate: [AuthGuard]},
  {
    path: 'activity/make',
    component: MakeActivityComponent,
    canActivate: [RoleGuard],
    data: {roles: [Role.Specialist, Role.Admin]}
  },
  {
    path: 'activity/make/:activityId',
    component: MakeActivityComponent,
    canActivate: [RoleGuard],
    data: {roles: [Role.Specialist, Role.Admin]}
  },
  {path: 'activity/:activityId', component: ActivityComponent, canActivate: [AuthGuard]},
  {path: 'lesson/:lessonId', component: LessonComponent, canActivate: [AuthGuard]},
  {path: 'support', component: SupportComponent, canActivate: [AuthGuard]},
  {path: 'ticket/:ticketId', component: TicketComponent, canActivate: [AuthGuard]},

  {path: '**', component: NotFoundComponent}
];
