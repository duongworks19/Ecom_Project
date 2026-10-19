import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { UserMenuComponent } from './user-menu.component';
import { ProfileApiService } from '../../../../features/account/profile/data-access/profile-api.service';

describe('UserMenuComponent', () => {
  let fixture: ComponentFixture<UserMenuComponent>;
  let component: UserMenuComponent;
  let router: Router;
  let profileService: ProfileApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMenuComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(UserMenuComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    profileService = TestBed.inject(ProfileApiService);
    fixture.detectChanges();
  });

  it('opens menu on trigger click and closes on Escape', () => {
    const trigger = fixture.nativeElement.querySelector('.user-menu__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector('[role="menu"]') as HTMLElement;
    expect(menu).toBeTruthy();

    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
  });

  it('closes menu when clicking outside', () => {
    component.toggleMenu();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    document.body.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(false);
  });

  it('supports keyboard ArrowDown and ArrowUp navigation across menu items', async () => {
    component.toggleMenu();
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 10));

    const items = Array.from(
      fixture.nativeElement.querySelectorAll('[role="menuitem"]')
    ) as HTMLButtonElement[];
    expect(items.length).toBe(3);

    items[0].focus();
    const menu = fixture.nativeElement.querySelector('[role="menu"]') as HTMLElement;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);

    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items[0]);
  });

  it('navigates to /account/profile, /account/orders and calls logout', () => {
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const logoutSpy = vi.spyOn(profileService, 'logout').mockReturnValue(of(undefined));

    component.navigateToProfile();
    expect(navSpy).toHaveBeenCalledWith('/account/profile');

    component.navigateToOrders();
    expect(navSpy).toHaveBeenCalledWith('/account/orders');

    component.logout();
    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(navSpy).toHaveBeenCalledWith('/login');
  });
});
