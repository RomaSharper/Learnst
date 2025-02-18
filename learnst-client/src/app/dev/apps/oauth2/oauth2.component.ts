import { ReactiveFormsModule } from '@angular/forms';
import { AppsService } from '../../../../services/apps.service';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-oauth2',
  templateUrl: './oauth2.component.html',
  styleUrls: ['./oauth2.component.scss'],
  imports: [MatInputModule, MatButtonModule, MatFormFieldModule, ReactiveFormsModule]
})
export class OAuth2Component implements OnInit {
  state = '';
  clientName = '';
  redirectUri = '';
  responseType = '';
  errorMessage = '';
  requestedScopes: string[] = [];

  constructor(private route: ActivatedRoute, private appsService: AppsService) {}

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const clientId = queryParams.get('client_id');
    const redirectUri = queryParams.get('redirect_uri');
    const responseType = queryParams.get('response_type');
    const scope = queryParams.get('scope');
    const state = queryParams.get('state');
    const missingParameters: string[] = [];

    if (!clientId)
      missingParameters.push('clientId');

    if (!redirectUri)
      missingParameters.push('redirectUri');

    if (!responseType)
      missingParameters.push('responseType');

    if (!scope)
      missingParameters.push('scope');

    if (missingParameters.length || responseType != 'code') {
      this.errorMessage = `Отсутствует один или несколько необходимых параметров: ${missingParameters.join(', ')}`;
      console.error(this.errorMessage);
      return;
    }

    this.redirectUri = redirectUri!;
    this.state = state!;
    this.requestedScopes = scope!.split('+');
    console.log(this.requestedScopes);

    // Fetch client name from API
    this.appsService.getApplication(clientId!).subscribe({
      next: client => this.clientName = client.name,
      error: error => console.error('Ошибка при обработке клиента:', error)
    });
  }

  authorize(approved: boolean) {
  }
}
