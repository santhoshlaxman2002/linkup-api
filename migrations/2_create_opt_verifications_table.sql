create table if not exists otp_verifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null,
	otp varchar(6) not null,
	expires_at timestamp not null default ( current_timestamp + interval '5 minutes' ),
	created_at timestamp default current_timestamp,
	constraint fk_user
		foreign key(user_id)
		references users(id)
		on delete cascade
)